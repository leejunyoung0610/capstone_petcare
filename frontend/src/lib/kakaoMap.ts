/**
 * 카카오맵 JavaScript SDK 동적 로더.
 *
 * 정적 <script> 로 넣으면 React 컴포넌트가 더 일찍 mount 될 때
 * window.kakao 가 아직 없어 "SDK 로드 실패" 로 오인할 수 있다.
 * 또한 광고차단기/사용자 환경에 따라 로드가 실패할 수도 있어
 * 컴포넌트 단계에서 명시적으로 로드 + 에러를 다루는 편이 안전하다.
 */

const SDK_URL_BASE = "https://dapi.kakao.com/v2/maps/sdk.js";

let loadPromise: Promise<typeof kakao> | null = null;

export function loadKakaoMapsSdk(appKey: string): Promise<typeof kakao> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경이 아닙니다."));
  }
  if (!appKey) {
    return Promise.reject(
      new Error("VITE_KAKAO_MAP_KEY 가 비어 있습니다. frontend/.env 를 확인하세요.")
    );
  }
  // 이미 로드되어 있다면 즉시 반환
  if (window.kakao?.maps?.LatLng) {
    return Promise.resolve(window.kakao);
  }
  // 진행 중이면 같은 Promise 재사용 (StrictMode 등으로 중복 호출 방지)
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
    const onReady = () => {
      if (!window.kakao?.maps?.load) {
        reject(new Error("카카오맵 SDK 가 정상적으로 노출되지 않았습니다."));
        return;
      }
      window.kakao.maps.load(() => {
        if (window.kakao?.maps?.LatLng) resolve(window.kakao);
        else reject(new Error("kakao.maps.load 후에도 SDK 가 준비되지 않았습니다."));
      });
    };

    if (existing) {
      // 다른 곳에서 이미 추가했고 onload 가 끝나기 전이면 이벤트 대기
      if (window.kakao?.maps?.load) onReady();
      else existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("카카오맵 SDK 다운로드 실패")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    // autoload=false 로 받아와서 우리가 원하는 시점에 maps.load 호출
    script.src = `${SDK_URL_BASE}?appkey=${appKey}&libraries=services&autoload=false`;
    script.onload = onReady;
    script.onerror = () => {
      loadPromise = null; // 실패 시 다음 호출에서 재시도 가능
      reject(
        new Error(
          "카카오맵 SDK 다운로드에 실패했습니다. 광고차단기나 네트워크/도메인 등록 상태를 확인해주세요."
        )
      );
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
