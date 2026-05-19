import axios from 'axios';

/**
 * Backend API base URL.
 *
 * dev 서버 (vite) 가 /api, /uploads 를 백엔드로 프록시하므로
 * 기본은 **같은 origin 의 /api** (휴대폰 LAN: PC_IP:5173 → 프록시 → 백엔드).
 *
 * VITE_API_URL 을 `http://localhost:8001/api` 처럼 두면 **PC 브라우저에서는 편하지만**,
 * 휴대폰에서 `http://192.168.x.x:5173` 으로 열면 `localhost` 가 폰 자신을 가리켜 API 가 전부 실패한다.
 * → LAN 호스트로 접속한 경우 localhost/127.0.0.1 API URL 은 무시하고 `/api` 를 쓴다.
 */
function detectBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL?.toString().trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    const base = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      const onLanHost =
        /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || /\.local$/i.test(h);
      const pointsToLoopback =
        /localhost/i.test(base) || base.includes('127.0.0.1');
      if (onLanHost && pointsToLoopback) {
        console.warn(
          '[GANADI] VITE_API_URL이 루프백(localhost)입니다. 휴대폰 LAN 접속 시 /api(프록시)로 전환합니다.',
        );
        return '/api';
      }
    }
    return base;
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

/** 로그인/회원가입 등은 401 그대로 넘겨 화면에 detail 을 표시해야 함 (refresh·리다이렉트 금지) */
function skipRefreshOn401(config) {
  const url = config?.url ?? '';
  return (
    url.includes('/auth/user/login') ||
    url.includes('/auth/vet/login') ||
    url.includes('/auth/user/register') ||
    url.includes('/auth/vet/register') ||
    url.includes('/auth/vet/register-with-docs') ||
    url.includes('/auth/refresh') ||
    url.includes('/users/me/password') ||
    url.includes('/users/me')
  );
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !skipRefreshOn401(originalRequest)) {
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
        const path = window.location.pathname || '';
        const authPages =
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/vet/register') ||
          path.startsWith('/auth/kakao');
        if (!authPages) {
          window.location.href = '/login';
        }
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
