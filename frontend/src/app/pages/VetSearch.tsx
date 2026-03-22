import { useState } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Search, MapPin, Star, Phone, Clock, Navigation } from "lucide-react";

export function VetSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockVets = [
    {
      id: 1,
      name: "김동물 수의사",
      hospital: "행복동물병원",
      address: "서울시 강남구 테헤란로 123",
      distance: "1.2km",
      rating: 4.8,
      reviewCount: 127,
      speciality: "안과 전문",
      careerYears: 15,
      fee: 30000,
      lat: 37.5665,
      lng: 126.9780
    },
    {
      id: 2,
      name: "이수의 수의사",
      hospital: "펫케어동물병원",
      address: "서울시 강남구 역삼동 456",
      distance: "2.5km",
      rating: 4.6,
      reviewCount: 89,
      speciality: "종합 진료",
      careerYears: 10,
      fee: 25000,
      lat: 37.5665,
      lng: 126.9780
    },
    {
      id: 3,
      name: "박수의 수의사",
      hospital: "우리동물병원",
      address: "서울시 서초구 서초동 789",
      distance: "3.8km",
      rating: 4.9,
      reviewCount: 234,
      speciality: "안과·피부과 전문",
      careerYears: 20,
      fee: 35000,
      lat: 37.5665,
      lng: 126.9780
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">수의사 찾기</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="지역, 병원명, 수의사명으로 검색..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 font-mono text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <WireframeButton variant="primary" className="px-8">
              검색
            </WireframeButton>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-blue-100 border-2 border-blue-500 text-blue-700 text-sm font-mono">
              내 위치 기준
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 bg-white text-sm font-mono">
              안과 전문
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 bg-white text-sm font-mono">
              평점 높은순
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 bg-white text-sm font-mono">
              거리 가까운순
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Map */}
          <div className="lg:sticky lg:top-24 h-fit">
            <WireframeBox label="INTERACTIVE MAP">
              <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm relative">
                [Kakao Map API / Naver Map API]
                <br />
                수의사 위치 마커 표시
                <br />
                <br />
                📍 현재 위치
                <br />
                🏥 병원 위치 (클러스터링)
                
                {/* Mock markers */}
                <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <div className="absolute bottom-1/4 left-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
              </div>
            </WireframeBox>
          </div>

          {/* Right - Vet List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 font-mono">
                총 <strong>{mockVets.length}명</strong>의 수의사를 찾았습니다
              </p>
            </div>

            {mockVets.map((vet) => (
              <WireframeBox key={vet.id} label={`VET CARD ${vet.id}`} className="bg-white">
                <div className="flex gap-4">
                  {/* Profile Image */}
                  <div className="w-24 h-24 bg-gray-300 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-mono">
                    [프로필]
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold">{vet.name}</h3>
                        <p className="text-sm text-gray-600">{vet.hospital}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{vet.rating}</span>
                          <span className="text-xs text-gray-500">({vet.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{vet.address}</span>
                        <span className="text-blue-600 font-bold">({vet.distance})</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          경력 {vet.careerYears}년
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          {vet.speciality}
                        </span>
                      </div>

                      <div className="text-gray-600">
                        원격 상담료: <strong className="text-gray-900">{vet.fee.toLocaleString()}원</strong>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/opinion-request/${vet.id}`} className="flex-1">
                        <WireframeButton variant="primary" className="w-full text-sm py-2">
                          소견 요청
                        </WireframeButton>
                      </Link>
                      <WireframeButton variant="outline" className="px-4 py-2 text-sm">
                        <Phone className="w-4 h-4" />
                      </WireframeButton>
                      <WireframeButton variant="outline" className="px-4 py-2 text-sm">
                        <Navigation className="w-4 h-4" />
                      </WireframeButton>
                    </div>
                  </div>
                </div>

                {/* Reviews Preview */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-bold">최근 리뷰</p>
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                    "우리 강아지 눈 문제를 정확하게 진단해주셨어요. 친절하고 자세한 설명 감사합니다!"
                    <div className="text-gray-500 mt-1">- 보호자 김** (2026.03.10)</div>
                  </div>
                </div>
              </WireframeBox>
            ))}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">←</button>
              <button className="w-10 h-10 border-2 border-blue-500 bg-blue-100 text-blue-700 font-mono font-bold">1</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">2</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">3</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
