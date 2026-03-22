import { useState } from "react";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { MessageCircle, Clock, CheckCircle, XCircle, FileText, Star, TrendingUp, Calendar } from "lucide-react";

export function VetDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "stats">("pending");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Vet Profile Header */}
        <WireframeBox label="VET PROFILE" className="bg-gradient-to-r from-green-50 to-emerald-50 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-mono">
              [프로필]
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">김동물 수의사</h1>
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded">
                  승인됨
                </span>
              </div>
              <p className="text-gray-600 mb-2">행복동물병원 · 안과 전문 · 경력 15년</p>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <strong>4.8</strong> (리뷰 127개)
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  대기 중 소견: <strong>3건</strong>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  완료된 소견: <strong>89건</strong>
                </span>
              </div>
            </div>
            <WireframeButton variant="outline">프로필 수정</WireframeButton>
          </div>
        </WireframeBox>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <WireframeBox label="STAT 1" className="bg-blue-50">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600 mb-1">3</div>
              <div className="text-sm text-gray-600 font-mono">대기 중</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="STAT 2" className="bg-green-50">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600 mb-1">12</div>
              <div className="text-sm text-gray-600 font-mono">이번 주 완료</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="STAT 3" className="bg-yellow-50">
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-600 mb-1">4.8</div>
              <div className="text-sm text-gray-600 font-mono">평균 평점</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="STAT 4" className="bg-purple-50">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600 mb-1">267K</div>
              <div className="text-sm text-gray-600 font-mono">이번 달 수익</div>
            </div>
          </WireframeBox>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-gray-300 mb-8">
          <div className="flex gap-2">
            {[
              { key: "pending", label: "대기 중 소견", icon: Clock },
              { key: "completed", label: "완료된 소견", icon: CheckCircle },
              { key: "stats", label: "통계", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 border-2 border-b-0 font-mono text-sm flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-white border-gray-300 border-b-white -mb-0.5 relative z-10"
                    : "bg-gray-100 border-transparent text-gray-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pending Opinions */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            {[
              {
                id: 1,
                date: "2026-03-13 10:30",
                pet: "뽀삐 (강아지, 3세)",
                owner: "홍길동",
                symptom: "눈이 충혈되고 눈곱이 많이 끼어요. 3일 전부터 증상이 시작되었습니다.",
                hasAI: true,
                aiDisease: "결막염",
                aiConfidence: 87.3,
                imageCount: 3,
                status: "PENDING"
              },
              {
                id: 2,
                date: "2026-03-13 14:15",
                pet: "나비 (고양이, 2세)",
                owner: "김영희",
                symptom: "각막에 흰색 반점이 보이고 눈물을 많이 흘립니다.",
                hasAI: false,
                aiDisease: null,
                aiConfidence: null,
                imageCount: 2,
                status: "PENDING"
              },
            ].map((request) => (
              <WireframeBox key={request.id} label={`REQUEST ${request.id}`} className="bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{request.pet}</h3>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                        {request.status === "PENDING" ? "대기 중" : "진행 중"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">보호자: {request.owner}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      요청일시: {request.date}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    #{request.id.toString().padStart(5, '0')}
                  </div>
                </div>

                {request.hasAI && (
                  <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded mb-4">
                    <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      AI 분석 결과 첨부됨
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">대표 질환: <strong className="text-blue-700">{request.aiDisease}</strong></p>
                        <p className="text-sm">신뢰도: <strong>{request.aiConfidence}%</strong></p>
                      </div>
                      <WireframeButton variant="outline" className="text-xs py-1">
                        AI 결과 보기
                      </WireframeButton>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-sm mb-2">증상 설명</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded leading-relaxed">
                    {request.symptom}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="font-bold text-sm mb-2">첨부 이미지 ({request.imageCount}장)</p>
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: request.imageCount }).map((_, i) => (
                      <div
                        key={i}
                        className="w-full h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-mono cursor-pointer hover:bg-gray-300"
                      >
                        [이미지 {i + 1}]
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <WireframeButton variant="primary" className="flex-1">
                    소견 작성하기
                  </WireframeButton>
                  <WireframeButton variant="outline">
                    상세 보기
                  </WireframeButton>
                </div>
              </WireframeBox>
            ))}
          </div>
        )}

        {/* Completed Opinions */}
        {activeTab === "completed" && (
          <div className="space-y-6">
            {[
              {
                id: 3,
                date: "2026-03-12 15:20",
                completedDate: "2026-03-12 18:30",
                pet: "초코 (강아지, 5세)",
                owner: "이철수",
                disease: "각막궤양",
                opinion: "각막궤양 초기 소견이 보입니다. 항생제 안약 처방이 필요하며...",
                visitRequired: true,
                rating: 5,
                review: "정말 자세하게 설명해주셔서 감사합니다!",
                fee: 30000
              },
              {
                id: 4,
                date: "2026-03-11 10:15",
                completedDate: "2026-03-11 14:45",
                pet: "뭉치 (고양이, 4세)",
                owner: "박민수",
                disease: "결막염",
                opinion: "결막염 증상으로 보입니다. 눈 주변을 깨끗이 관리하시고...",
                visitRequired: false,
                rating: 4,
                review: "친절한 답변 감사합니다.",
                fee: 30000
              },
            ].map((completed) => (
              <WireframeBox key={completed.id} label={`COMPLETED ${completed.id}`} className="bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{completed.pet}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        완료
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">보호자: {completed.owner}</p>
                    <p className="text-sm text-gray-600">요청: {completed.date}</p>
                    <p className="text-sm text-gray-600">완료: {completed.completedDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{completed.rating}.0</span>
                    </div>
                    <p className="text-sm font-bold">{completed.fee.toLocaleString()}원</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-bold text-sm mb-2">작성한 소견</p>
                  <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
                    <p className="text-sm text-gray-700 mb-2">{completed.opinion}</p>
                    <div className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                      completed.visitRequired 
                        ? "bg-red-100 text-red-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {completed.visitRequired ? "⚠️ 병원 방문 필요" : "✓ 경과 관찰"}
                    </div>
                  </div>
                </div>

                {completed.review && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded">
                    <p className="font-bold text-sm mb-1">보호자 리뷰</p>
                    <p className="text-sm text-gray-700">"{completed.review}"</p>
                  </div>
                )}
              </WireframeBox>
            ))}
          </div>
        )}

        {/* Statistics */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WireframeBox label="MONTHLY CHART">
                <h3 className="font-bold mb-4">월별 소견 요청 추이</h3>
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                  [Recharts Line Chart]
                  <br />
                  월별 소견 요청 건수 그래프
                </div>
              </WireframeBox>

              <WireframeBox label="RATING CHART">
                <h3 className="font-bold mb-4">평점 분포</h3>
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                  [Recharts Bar Chart]
                  <br />
                  평점별 리뷰 수 그래프
                </div>
              </WireframeBox>
            </div>

            <WireframeBox label="REVENUE STATS">
              <h3 className="font-bold mb-4">수익 통계</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">이번 달</p>
                  <p className="text-2xl font-bold text-blue-600">267,000원</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">지난 달</p>
                  <p className="text-2xl font-bold text-green-600">320,000원</p>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">총 누적</p>
                  <p className="text-2xl font-bold text-purple-600">2,670,000원</p>
                </div>
              </div>
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                [Recharts Area Chart]
                <br />
                월별 수익 추이
              </div>
            </WireframeBox>

            <WireframeBox label="DISEASE DISTRIBUTION">
              <h3 className="font-bold mb-4">질환별 소견 분포</h3>
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                [Recharts Pie Chart]
                <br />
                질환별 소견 비율
              </div>
            </WireframeBox>
          </div>
        )}
      </div>
    </div>
  );
}
