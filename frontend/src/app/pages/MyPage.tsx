import { useState } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { PawPrint, FileText, MessageCircle, Settings, Calendar, TrendingUp, Eye, Plus } from "lucide-react";

export function MyPage() {
  const [activeTab, setActiveTab] = useState<"pets" | "history" | "opinions" | "settings">("pets");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <WireframeBox label="USER PROFILE" className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-mono">
              [프로필]
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">홍길동 님</h1>
              <p className="text-gray-600 mb-2">hong@email.com</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <PawPrint className="w-4 h-4" />
                  반려동물 3마리
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  검사 15회
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  소견 5회
                </span>
              </div>
            </div>
          </div>
        </WireframeBox>

        {/* Tabs */}
        <div className="border-b-2 border-gray-300 mb-8">
          <div className="flex gap-2">
            {[
              { key: "pets", label: "반려동물 관리", icon: PawPrint },
              { key: "history", label: "검사 이력", icon: FileText },
              { key: "opinions", label: "수의사 소견", icon: MessageCircle },
              { key: "settings", label: "설정", icon: Settings },
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

        {/* Tab Content */}
        {activeTab === "pets" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">내 반려동물</h2>
              <WireframeButton variant="primary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                반려동물 추가
              </WireframeButton>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: 1, name: "뽀삐", species: "DOG", breed: "포메라니안", age: 3, lastCheck: "2026-03-13", totalChecks: 8 },
                { id: 2, name: "나비", species: "CAT", breed: "코리안 숏헤어", age: 2, lastCheck: "2026-03-10", totalChecks: 5 },
                { id: 3, name: "초코", species: "DOG", breed: "푸들", age: 5, lastCheck: "2026-03-05", totalChecks: 12 },
              ].map((pet) => (
                <WireframeBox key={pet.id} label={`PET ${pet.id}`} className="bg-white">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500 text-xs font-mono">
                      [사진]
                    </div>
                    <h3 className="text-xl font-bold mb-1">{pet.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {pet.species === "DOG" ? "🐕 강아지" : "🐱 고양이"} · {pet.breed} · {pet.age}세
                    </p>
                    
                    <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">마지막 검사</span>
                        <span className="font-bold">{pet.lastCheck}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">총 검사 횟수</span>
                        <span className="font-bold">{pet.totalChecks}회</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <WireframeButton variant="outline" className="flex-1 text-sm py-2">
                        상세정보
                      </WireframeButton>
                      <Link to="/upload" className="flex-1">
                        <WireframeButton variant="primary" className="w-full text-sm py-2">
                          검사하기
                        </WireframeButton>
                      </Link>
                    </div>
                  </div>
                </WireframeBox>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">검사 이력</h2>
              <div className="flex gap-2">
                <select className="p-2 border-2 border-gray-300 font-mono text-sm">
                  <option>전체 반려동물</option>
                  <option>뽀삐</option>
                  <option>나비</option>
                  <option>초코</option>
                </select>
                <select className="p-2 border-2 border-gray-300 font-mono text-sm">
                  <option>최근 순</option>
                  <option>오래된 순</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 1,
                  date: "2026-03-13 14:32",
                  pet: "뽀삐",
                  disease: "결막염",
                  confidence: 87.3,
                  severity: "중등도",
                  status: "이상 징후"
                },
                {
                  id: 2,
                  date: "2026-03-10 09:15",
                  pet: "나비",
                  disease: "각막궤양",
                  confidence: 76.2,
                  severity: "경증",
                  status: "이상 징후"
                },
                {
                  id: 3,
                  date: "2026-03-05 16:45",
                  pet: "초코",
                  disease: null,
                  confidence: null,
                  severity: null,
                  status: "정상"
                },
              ].map((record) => (
                <WireframeBox key={record.id} label={`RECORD ${record.id}`} className="bg-white">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-mono">
                      [원본 이미지]
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold">{record.pet}</h3>
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              record.status === "정상" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {record.date}
                          </p>
                        </div>
                        <Link to={`/result/${record.id}`}>
                          <WireframeButton variant="outline" className="text-sm">
                            <Eye className="inline w-4 h-4 mr-1" />
                            상세보기
                          </WireframeButton>
                        </Link>
                      </div>

                      {record.disease ? (
                        <div className="bg-red-50 border-2 border-red-200 p-3 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-red-700">{record.disease}</p>
                              <p className="text-sm text-gray-600">중증도: {record.severity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">{record.confidence}%</p>
                              <p className="text-xs text-gray-500">신뢰도</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
                          <p className="text-green-700 font-bold">이상 징후가 발견되지 않았습니다</p>
                          <p className="text-sm text-gray-600 mt-1">정기적인 검사를 권장합니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                </WireframeBox>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">←</button>
              <button className="w-10 h-10 border-2 border-blue-500 bg-blue-100 text-blue-700 font-mono font-bold">1</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">2</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">3</button>
              <button className="w-10 h-10 border-2 border-gray-300 bg-white font-mono">→</button>
            </div>
          </div>
        )}

        {activeTab === "opinions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">수의사 소견 내역</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 1,
                  date: "2026-03-12",
                  vet: "김동물 수의사",
                  hospital: "행복동물병원",
                  pet: "뽀삐",
                  status: "COMPLETED",
                  fee: 30000
                },
                {
                  id: 2,
                  date: "2026-03-08",
                  vet: "박수의 수의사",
                  hospital: "우리동물병원",
                  pet: "나비",
                  status: "IN_PROGRESS",
                  fee: 35000
                },
              ].map((opinion) => (
                <WireframeBox key={opinion.id} label={`OPINION ${opinion.id}`} className="bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{opinion.vet}</h3>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          opinion.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : opinion.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {opinion.status === "COMPLETED" ? "완료" : opinion.status === "IN_PROGRESS" ? "진행중" : "대기"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{opinion.hospital}</p>
                      <p className="text-sm text-gray-600">반려동물: {opinion.pet}</p>
                      <p className="text-sm text-gray-600">요청일: {opinion.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{opinion.fee.toLocaleString()}원</p>
                    </div>
                  </div>

                  {opinion.status === "COMPLETED" && (
                    <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded mb-3">
                      <p className="font-bold text-blue-900 mb-2">수의사 소견</p>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        결막염 초기 증상으로 보입니다. 눈 주변을 깨끗이 관리하시고, 
                        증상이 지속되거나 악화될 경우 3일 이내 내원하시어 정확한 진단을 받으시기 바랍니다.
                      </p>
                      <div className="flex gap-2">
                        <WireframeButton variant="outline" className="text-sm">
                          <FileText className="inline w-4 h-4 mr-1" />
                          소견서 PDF 다운로드
                        </WireframeButton>
                        <WireframeButton variant="outline" className="text-sm">
                          리뷰 작성
                        </WireframeButton>
                      </div>
                    </div>
                  )}

                  {opinion.status === "IN_PROGRESS" && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded">
                      <p className="text-sm text-yellow-800">
                        수의사가 검토 중입니다. 평균 12~24시간 내 소견이 제공됩니다.
                      </p>
                    </div>
                  )}
                </WireframeBox>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">설정</h2>

            <WireframeBox label="PROFILE SETTINGS">
              <h3 className="font-bold mb-4">프로필 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">이메일</label>
                  <input
                    type="email"
                    value="hong@email.com"
                    disabled
                    className="w-full p-3 border-2 border-gray-300 bg-gray-100 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">닉네임</label>
                  <input
                    type="text"
                    defaultValue="홍길동"
                    className="w-full p-3 border-2 border-gray-300 font-mono text-sm"
                  />
                </div>
                <WireframeButton variant="primary">정보 수정</WireframeButton>
              </div>
            </WireframeBox>

            <WireframeBox label="NOTIFICATION SETTINGS">
              <h3 className="font-bold mb-4">알림 설정</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">소견 완료 알림</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">정기 검사 알림 (월 1회)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" />
                  <span className="text-sm">마케팅 정보 수신</span>
                </label>
              </div>
            </WireframeBox>

            <WireframeBox label="ACCOUNT MANAGEMENT" className="bg-red-50 border-red-300">
              <h3 className="font-bold mb-4 text-red-700">계정 관리</h3>
              <div className="space-y-3">
                <WireframeButton variant="secondary" className="w-full">
                  비밀번호 변경
                </WireframeButton>
                <WireframeButton variant="outline" className="w-full text-red-600 border-red-400">
                  회원 탈퇴
                </WireframeButton>
              </div>
            </WireframeBox>
          </div>
        )}
      </div>
    </div>
  );
}
