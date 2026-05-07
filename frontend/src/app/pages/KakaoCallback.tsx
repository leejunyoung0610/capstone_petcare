import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import apiClient from "../../api/client";
import useAuthStore from "../../stores/authStore";

export function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get("code");
    if (!code) {
      alert("카카오 로그인에 실패했습니다.");
      navigate("/login");
      return;
    }

    // 백엔드가 카카오 token 교환 시 사용해야 할 redirect_uri 를 명시적으로 전달.
    // (휴대폰 LAN 접속 등 origin 이 .env 와 다를 때도 일치하도록)
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    apiClient
      .post("/auth/kakao/callback", { code, redirect_uri: redirectUri })
      .then((res) => {
        const { access_token, refresh_token, name, role } = res.data;
        localStorage.setItem("token", access_token);
        if (refresh_token) {
          localStorage.setItem("refreshToken", refresh_token);
        }
        setAuth({ token: access_token, user: { name, role } });
        if (role === "admin") navigate("/admin/dashboard");
        else navigate("/dashboard");
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || err?.message || "알 수 없는 오류";
        console.error("[KakaoCallback] 실패:", detail, err?.response?.data);
        alert(`카카오 로그인에 실패했습니다.\n${detail}`);
        navigate("/login");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <p className="text-sm text-slate-500">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
}