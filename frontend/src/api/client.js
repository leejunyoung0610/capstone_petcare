import axios from 'axios';

/**
 * Backend API base URL.
 *
 * dev 서버 (vite) 가 /api, /uploads 를 백엔드(8001) 로 프록시하므로
 * 프론트는 항상 **같은 origin 의 상대 경로** 를 쓴다.
 *   - PC localhost:5173   → /api/...           → vite proxy → :8001
 *   - 휴대폰 172.x.x.x:5173 → /api/...           → vite proxy → :8001
 *   - ngrok https://xxx     → /api/...           → vite proxy → :8001
 *
 * VITE_API_URL 환경변수가 있으면 그걸 우선 (배포/특수 환경).
 */
function detectBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL?.toString().trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return '/api';
}

// 다른 파일에서 정적 자산(/uploads/...) 이나 OAuth 시작 URL 만들 때 같은 기준 사용.
//   - apiBaseURL : "/api"  또는 "https://api.ganadi.app/api"
//   - serverOrigin: ""     또는 "https://api.ganadi.app"
//     (브라우저는 빈 문자열도 자기 origin 으로 해석함 — 'a/b' 도 동일 동작)
export const apiBaseURL = detectBaseURL();
export const serverOrigin = apiBaseURL.replace(/\/?api$/, '');

const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/users/me/password')) {
      // 이미 refresh 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      // refresh 토큰 없으면 바로 로그아웃
      if (!refreshToken) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await apiClient.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
