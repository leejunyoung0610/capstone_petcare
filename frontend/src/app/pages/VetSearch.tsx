import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import {
  Search,
  MapPin,
  Star,
  Phone,
  Navigation,
  Stethoscope,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { matchHospitalsWithGanadi } from "../../api/vets";
import { loadKakaoMapsSdk } from "../../lib/kakaoMap";

/**
 * 카카오맵 기반 병원 찾기.
 *
 * 흐름:
 *   1) 카카오맵 SDK 로드 (kakao.maps.load)
 *   2) 사용자 현재 위치 (geolocation) — 거부 시 강남역 기본 좌표
 *   3) 카카오 키워드 검색("동물병원") 으로 주변 동물병원 조회
 *      ※ categorySearch(HP8) 는 일반 병원까지 포함되어 동물병원이 밀려나는 문제로 변경
 *   4) 1·2 페이지(최대 30건) 거리순 합쳐서 결과 충분히 확보
 *   5) 백엔드 `/api/vets/match-hospitals` 로 GANADI 등록 여부/평점 합본
 *   6) 지도에 마커 + 카드 리스트 표시 (인증/일반 구분)
 */

// 강남역 (geolocation 거부 시 폴백)
const FALLBACK_CENTER = { lat: 37.4979, lng: 127.0276 };
// 도심·외곽 모두 한 페이지에 결과 잡히도록 5km 로 확장
const SEARCH_RADIUS_M = 5000;
// 검색 키워드 — 카카오는 "동물병원" 한 단어로도 동물의료센터 등이 함께 잡힘
const SEARCH_KEYWORD = "동물병원";
// 한 번에 점프할 수 있는 인기 지역 (서울 중심 + 주요 도시)
const QUICK_REGIONS = [
  "홍대",
  "강남역",
  "잠실",
  "건대입구",
  "신촌",
  "이태원",
  "성수",
  "판교역",
  "서울역",
  "부산 서면",
];

type SortKey = "distance" | "rating" | "ganadi";

interface Hospital {
  place_id: string;
  place_name: string;
  address: string | null;
  road_address: string | null;
  phone: string | null;
  x: number;
  y: number;
  distance_m: number | null;

  is_ganadi: boolean;
  vet_id: number | null;
  vet_name: string | null;
  specialty: string | null;
  business_hours: string | null;
  rating: number | null;
  review_count: number;
}

const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;

export function VetSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ganadi");
  const [onlyGanadi, setOnlyGanadi] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

  // ---------- 위치 가져오기 ----------
  const getCurrentPosition = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(FALLBACK_CENTER);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(FALLBACK_CENTER),
        { timeout: 5000, maximumAge: 60_000 }
      );
    });
  }, []);

  // ---------- 카카오 검색 + GANADI 매칭 ----------
  const searchNearbyHospitals = useCallback(
    async (center: { lat: number; lng: number }) => {
      if (!window.kakao?.maps) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const ps = new window.kakao.maps.services.Places();
        const center_ll = new window.kakao.maps.LatLng(center.lat, center.lng);

        // 카카오 키워드 검색은 한 페이지 최대 15건이라 1·2 페이지를 합쳐 최대 30건 확보
        const fetchPage = (page: number): Promise<kakao.maps.services.PlaceItem[]> =>
          new Promise((resolve, reject) => {
            ps.keywordSearch(
              SEARCH_KEYWORD,
              (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) resolve(data);
                else if (status === window.kakao.maps.services.Status.ZERO_RESULT) resolve([]);
                else reject(new Error(`카카오 검색 실패 (status=${status})`));
              },
              {
                location: center_ll,
                radius: SEARCH_RADIUS_M,
                sort: window.kakao.maps.services.SortBy.DISTANCE,
                size: 15,
                page,
              }
            );
          });

        const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(2).catch(() => [])]);
        const merged = [...page1, ...page2];

        // 같은 place_id 중복 제거 — 페이지 경계에서 종종 발생
        const seen = new Set<string>();
        const uniqueHospitals = merged.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        console.log(
          `[VetSearch] center=(${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}), ` +
            `radius=${SEARCH_RADIUS_M}m, raw=${merged.length}, unique=${uniqueHospitals.length}`
        );

        const lookupPayload = uniqueHospitals.map((p) => ({
          place_id: p.id,
          place_name: p.place_name,
          address: p.address_name || null,
          road_address: p.road_address_name || null,
          phone: p.phone || null,
          x: Number(p.x),
          y: Number(p.y),
          distance_m: p.distance ? Number(p.distance) : null,
        }));

        if (lookupPayload.length === 0) {
          setHospitals([]);
          setErrorMsg(
            `현재 위치 (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}) 반경 ${
              SEARCH_RADIUS_M / 1000
            }km 안에서 동물병원을 찾지 못했습니다. ` +
              "위치 권한을 허용했는지 확인하거나, 지도를 이동해 다른 지역에서 시도해보세요."
          );
          return;
        }

        const matched: Hospital[] = await matchHospitalsWithGanadi(lookupPayload);
        setHospitals(matched);
      } catch (e) {
        console.error("[VetSearch] 검색 실패:", e);
        setErrorMsg("주변 동물병원 검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---------- 지역명으로 이동 (예: "홍대", "강남역", "서울 종로구") ----------
  const searchByRegion = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;
      if (!window.kakao?.maps) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const ps = new window.kakao.maps.services.Places();
        // 첫 매칭 결과의 좌표를 지역 좌표로 사용 — 동물병원이 아닌 일반 장소까지 포함되도록
        // 별도 키워드로 검색 (radius 없이 전국 범위)
        const places: kakao.maps.services.PlaceItem[] = await new Promise(
          (resolve, reject) => {
            ps.keywordSearch(
              query,
              (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) resolve(data);
                else if (status === window.kakao.maps.services.Status.ZERO_RESULT) resolve([]);
                else reject(new Error(`지역 검색 실패 (status=${status})`));
              },
              { size: 1 }
            );
          }
        );

        if (places.length === 0) {
          setErrorMsg(
            `'${query}' 지역을 찾지 못했습니다. 더 구체적으로 입력해보세요 (예: 서울 마포구 홍대입구역)`
          );
          setLoading(false);
          return;
        }

        const place = places[0];
        const newCenter = { lat: Number(place.y), lng: Number(place.x) };

        if (mapRef.current) {
          mapRef.current.setLevel(5);
          mapRef.current.setCenter(new window.kakao.maps.LatLng(newCenter.lat, newCenter.lng));
        }

        console.log(
          `[VetSearch] 지역 이동: '${query}' → ${place.place_name} (${newCenter.lat.toFixed(4)}, ${newCenter.lng.toFixed(4)})`
        );

        await searchNearbyHospitals(newCenter);
      } catch (e) {
        console.error("[VetSearch] 지역 검색 실패:", e);
        setErrorMsg("지역 검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setLoading(false);
      }
    },
    [searchNearbyHospitals]
  );

  // ---------- 카카오맵 SDK 로드 + 초기 검색 ----------
  useEffect(() => {
    if (!apiKey) {
      setErrorMsg(
        "카카오맵 API 키가 설정되지 않았습니다. frontend/.env 의 VITE_KAKAO_MAP_KEY 를 확인해주세요."
      );
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        await loadKakaoMapsSdk(apiKey);
        if (cancelled) return;

        const center = await getCurrentPosition();
        if (cancelled) return;

        if (mapDivRef.current && !mapRef.current) {
          mapRef.current = new window.kakao.maps.Map(mapDivRef.current, {
            center: new window.kakao.maps.LatLng(center.lat, center.lng),
            level: 4,
          });
        } else if (mapRef.current) {
          mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
        }
        await searchNearbyHospitals(center);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const currentOrigin =
          typeof window !== "undefined" ? window.location.origin : "현재 origin";
        console.error("[VetSearch] 카카오맵 SDK 로드 실패:", e, {
          origin: currentOrigin,
          apiKey: apiKey?.slice(0, 6) + "...",
        });
        setErrorMsg(
          `${msg}\n\n` +
            `현재 접속 주소: ${currentOrigin}\n\n` +
            "카카오 Developers Console 에서 위 주소를 모두 등록해야 합니다:\n" +
            `  • 플랫폼 → Web 사이트 도메인  : ${currentOrigin}\n` +
            `  • JavaScript 키 → SDK 도메인  : ${currentOrigin}\n` +
            "  • 카카오맵 서비스가 활성화 상태여야 합니다 (제품 설정 → 카카오맵)\n" +
            "    ※ 비활성 시 'OPEN_MAP_AND_LOCAL service' 에러 — 비즈 앱 등록 필요"
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 정렬/필터링된 결과 ----------
  const visibleHospitals = useMemo(() => {
    let arr = hospitals.filter((h) => {
      if (onlyGanadi && !h.is_ganadi) return false;
      return true;
    });

    arr = [...arr].sort((a, b) => {
      if (sortKey === "ganadi") {
        if (a.is_ganadi !== b.is_ganadi) return a.is_ganadi ? -1 : 1;
        return (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity);
      }
      if (sortKey === "rating") {
        return (b.rating ?? -1) - (a.rating ?? -1);
      }
      return (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity);
    });
    return arr;
  }, [hospitals, sortKey, onlyGanadi]);

  // ---------- 지도 마커 갱신 ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    // 이전 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (visibleHospitals.length === 0) return;

    const newMarkers: kakao.maps.Marker[] = [];

    visibleHospitals.forEach((h) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(h.y, h.x),
        title: h.place_name,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        // 인포윈도우 — 간단한 카드
        if (infoWindowRef.current) infoWindowRef.current.close();
        const html = `
          <div style="padding:8px 12px;min-width:180px;max-width:240px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:2px;">
              ${h.place_name}${h.is_ganadi ? ' <span style="color:#2563eb;font-size:11px;">· GANADI 인증</span>' : ""}
            </div>
            <div style="font-size:11px;color:#64748b;">
              ${h.road_address || h.address || ""}
            </div>
          </div>
        `;
        infoWindowRef.current = new window.kakao.maps.InfoWindow({ content: html });
        infoWindowRef.current.open(map, marker);
        setActiveId(h.place_id);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
  }, [visibleHospitals]);

  // ---------- 새로고침 ----------
  const refresh = useCallback(async () => {
    const center = await getCurrentPosition();
    if (mapRef.current) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
    }
    await searchNearbyHospitals(center);
  }, [getCurrentPosition, searchNearbyHospitals]);

  const focusHospital = (h: Hospital) => {
    setActiveId(h.place_id);
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    map.setLevel(3);
    map.panTo(new window.kakao.maps.LatLng(h.y, h.x));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-10">
        {/* 헤더 — 모바일에선 한 줄, 다시 검색은 아이콘 버튼 */}
        <div className="mb-4 sm:mb-6 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">동물병원 찾기</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              반경 {(SEARCH_RADIUS_M / 1000).toFixed(0)}km · GANADI 인증은 별점/리뷰 함께 표시
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="내 위치로 다시 검색"
            title="내 위치로 다시 검색"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">내 위치로 다시 검색</span>
          </button>
        </div>

        {/* 검색 + 필터 */}
        <div className="mb-4 sm:mb-6 space-y-2.5 sm:space-y-3">
          {/* 지역 검색 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="지역 검색 (예: 홍대, 강남역)"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchByRegion(searchQuery);
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => searchByRegion(searchQuery)}
              disabled={loading || !searchQuery.trim()}
              aria-label="지역 이동"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:px-5"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">이동</span>
            </button>
          </div>

          {/* 빠른 지역 선택 — 모바일에선 가로 스크롤 한 줄 */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max items-center gap-1.5 sm:w-auto sm:flex-wrap">
              {QUICK_REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSearchQuery(r);
                    searchByRegion(r);
                  }}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 + 필터 — 모바일에선 가로 스크롤 */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max items-center gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
              <button
                type="button"
                onClick={() => setSortKey("ganadi")}
                className={chipClass(sortKey === "ganadi")}
              >
                GANADI 우선
              </button>
              <button
                type="button"
                onClick={() => setSortKey("distance")}
                className={chipClass(sortKey === "distance")}
              >
                거리순
              </button>
              <button
                type="button"
                onClick={() => setSortKey("rating")}
                className={chipClass(sortKey === "rating")}
              >
                평점순
              </button>
              <label className="ml-1 inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-700 sm:ml-2 sm:text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={onlyGanadi}
                  onChange={(e) => setOnlyGanadi(e.target.checked)}
                />
                GANADI 인증만
              </label>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* 지도 — 모바일은 컴팩트, sm 이상은 더 큼 */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div ref={mapDivRef} className="h-[260px] w-full bg-slate-100 sm:h-[400px] lg:h-[520px]" />
            </div>
            <p className="mt-1.5 text-[11px] sm:text-xs text-slate-400">
              마커를 누르면 병원명이 보이고, 카드를 누르면 지도가 그 위치로 이동합니다.
            </p>
          </div>

          {/* 카드 리스트 */}
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-xs sm:text-sm text-slate-500">
              총 <strong className="text-slate-900">{visibleHospitals.length}곳</strong>의 동물병원
            </p>

            {loading && (
              <div className="flex items-center justify-center py-8 text-slate-400 sm:py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {!loading && visibleHospitals.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 sm:p-10">
                반경 {(SEARCH_RADIUS_M / 1000).toFixed(0)}km 안에서 동물병원을 찾지 못했어요.
              </div>
            )}

            {visibleHospitals.map((h) => (
              <HospitalCard
                key={h.place_id}
                hospital={h}
                active={activeId === h.place_id}
                onClick={() => focusHospital(h)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function chipClass(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-blue-600 bg-blue-600 text-white"
      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
  }`;
}

function HospitalCard({
  hospital,
  active,
  onClick,
}: {
  hospital: Hospital;
  active: boolean;
  onClick: () => void;
}) {
  const distanceLabel =
    hospital.distance_m == null
      ? null
      : hospital.distance_m >= 1000
        ? `${(hospital.distance_m / 1000).toFixed(1)}km`
        : `${Math.round(hospital.distance_m)}m`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl border bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow sm:p-5 ${
        active ? "border-blue-500 ring-1 ring-blue-200" : "border-slate-200"
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
            hospital.is_ganadi
              ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-slate-900">{hospital.place_name}</h3>
            {hospital.is_ganadi && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                <ShieldCheck className="h-3 w-3" /> GANADI 인증
              </span>
            )}
          </div>

          {hospital.is_ganadi && hospital.rating != null ? (
            <div className="mb-1 flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold text-slate-900">{hospital.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({hospital.review_count} 리뷰)</span>
            </div>
          ) : null}

          <div className="space-y-1 text-sm text-slate-500">
            <div className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {hospital.road_address || hospital.address || "주소 정보 없음"}
              </span>
              {distanceLabel && (
                <span className="ml-auto flex-shrink-0 font-semibold text-blue-600">
                  {distanceLabel}
                </span>
              )}
            </div>
            {hospital.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{hospital.phone}</span>
              </div>
            )}
            {hospital.is_ganadi && (hospital.specialty || hospital.business_hours) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {hospital.specialty && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {hospital.specialty}
                  </span>
                )}
                {hospital.business_hours && (
                  <span className="text-xs text-slate-400">{hospital.business_hours}</span>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {hospital.is_ganadi && hospital.vet_id ? (
              <Link
                to={`/opinion-request/${hospital.vet_id}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                소견 요청
              </Link>
            ) : (
              <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-400">
                GANADI 미가입 병원
              </span>
            )}
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Phone className="h-3 w-3" /> 전화
              </a>
            )}
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(hospital.place_name)},${hospital.y},${hospital.x}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Navigation className="h-3 w-3" /> 길찾기
            </a>
          </div>
        </div>
      </div>
    </button>
  );
}
