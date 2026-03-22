import { useState } from "react";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Users, Stethoscope, FileText, AlertTriangle, BarChart3, TrendingUp, CheckCircle, XCircle } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "vets" | "reports">("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>관리자: Admin</span>
            <WireframeButton variant="outline" className="text-sm">로그아웃</WireframeButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <WireframeBox label="USERS STAT" className="bg-blue-50">
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600 mb-1">1,247</div>
              <div className="text-sm text-gray-600 font-mono">전체 사용자</div>
              <div className="text-xs text-green-600 mt-1">+12 (이번 주)</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="VETS STAT" className="bg-green-50">
            <div className="text-center">
              <Stethoscope className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600 mb-1">89</div>
              <div className="text-sm text-gray-600 font-mono">등록 수의사</div>
              <div className="text-xs text-orange-600 mt-1">3명 승인 대기</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="DIAGNOSIS STAT" className="bg-purple-50">
            <div className="text-center">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600 mb-1">3,567</div>
              <div className="text-sm text-gray-600 font-mono">총 AI 분석</div>
              <div className="text-xs text-green-600 mt-1">+234 (이번 달)</div>
            </div>
          </WireframeBox>
          
          <WireframeBox label="REPORTS STAT" className="bg-red-50">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-600 mb-1">5</div>
              <div className="text-sm text-gray-600 font-mono">미처리 신고</div>
              <div className="text-xs text-red-600 mt-1">확인 필요</div>
            </div>
          </WireframeBox>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-gray-300 mb-8">
          <div className="flex gap-2">
            {[
              { key: "overview", label: "전체 개요", icon: BarChart3 },
              { key: "users", label: "사용자 관리", icon: Users },
              { key: "vets", label: "수의사 관리", icon: Stethoscope },
              { key: "reports", label: "신고 관리", icon: AlertTriangle },
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WireframeBox label="USER GROWTH CHART">
                <h3 className="font-bold mb-4">사용자 증가 추이</h3>
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                  [Recharts Line Chart]
                  <br />
                  월별 사용자 증가 그래프
                </div>
              </WireframeBox>

              <WireframeBox label="DIAGNOSIS CHART">
                <h3 className="font-bold mb-4">AI 분석 건수</h3>
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                  [Recharts Bar Chart]
                  <br />
                  월별 AI 분석 건수
                </div>
              </WireframeBox>
            </div>

            <WireframeBox label="DISEASE DISTRIBUTION">
              <h3 className="font-bold mb-4">검출된 질환 분포</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3 font-mono">강아지</p>
                  <div className="space-y-2">
                    {[
                      { name: "결막염", count: 456, color: "red" },
                      { name: "각막궤양", count: 234, color: "orange" },
                      { name: "백내장", count: 189, color: "yellow" },
                      { name: "녹내장", count: 123, color: "blue" },
                    ].map((disease) => (
                      <div key={disease.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{disease.name}</span>
                          <span className="font-bold">{disease.count}건</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${disease.color}-500`}
                            style={{ width: `${(disease.count / 456) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3 font-mono">고양이</p>
                  <div className="space-y-2">
                    {[
                      { name: "결막염", count: 234, color: "red" },
                      { name: "각막궤양", count: 156, color: "orange" },
                      { name: "각막부골편", count: 89, color: "yellow" },
                    ].map((disease) => (
                      <div key={disease.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{disease.name}</span>
                          <span className="font-bold">{disease.count}건</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${disease.color}-500`}
                            style={{ width: `${(disease.count / 234) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </WireframeBox>

            <WireframeBox label="RECENT ACTIVITY">
              <h3 className="font-bold mb-4">최근 활동</h3>
              <div className="space-y-2 text-sm">
                {[
                  { time: "5분 전", action: "신규 사용자 가입", user: "hong@email.com" },
                  { time: "12분 전", action: "AI 분석 완료", user: "kim@email.com" },
                  { time: "23분 전", action: "수의사 소견 제공", user: "김동물 수의사" },
                  { time: "1시간 전", action: "신고 접수", user: "park@email.com" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-mono w-16">{activity.time}</span>
                      <span>{activity.action}</span>
                      <span className="text-gray-600">- {activity.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </WireframeBox>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">사용자 관리</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="이메일, 닉네임 검색..."
                  className="px-4 py-2 border-2 border-gray-300 font-mono text-sm"
                />
                <WireframeButton variant="outline">검색</WireframeButton>
              </div>
            </div>

            <WireframeBox label="USERS TABLE">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-mono">ID</th>
                    <th className="text-left p-3 font-mono">이메일</th>
                    <th className="text-left p-3 font-mono">닉네임</th>
                    <th className="text-left p-3 font-mono">가입일</th>
                    <th className="text-left p-3 font-mono">분석횟수</th>
                    <th className="text-left p-3 font-mono">상태</th>
                    <th className="text-left p-3 font-mono">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1247, email: "hong@email.com", nickname: "홍길동", joinDate: "2026-03-10", analysisCount: 15, isActive: true },
                    { id: 1246, email: "kim@email.com", nickname: "김철수", joinDate: "2026-03-08", analysisCount: 8, isActive: true },
                    { id: 1245, email: "park@email.com", nickname: "박영희", joinDate: "2026-03-05", analysisCount: 23, isActive: false },
                  ].map((user) => (
                    <tr key={user.id} className="border-b border-gray-200">
                      <td className="p-3 font-mono">{user.id}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.nickname}</td>
                      <td className="p-3 font-mono">{user.joinDate}</td>
                      <td className="p-3 font-mono text-center">{user.analysisCount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          user.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {user.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-blue-600 hover:underline">상세</button>
                          <button className="text-xs text-red-600 hover:underline">정지</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WireframeBox>
          </div>
        )}

        {/* Vets Tab */}
        {activeTab === "vets" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">수의사 관리</h2>
              <div className="flex gap-2">
                <select className="p-2 border-2 border-gray-300 font-mono text-sm">
                  <option>전체</option>
                  <option>승인 대기</option>
                  <option>승인됨</option>
                  <option>거부됨</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 1,
                  name: "이수의 수의사",
                  email: "lee@vet.com",
                  hospital: "펫케어동물병원",
                  license: "12345-67890",
                  status: "PENDING",
                  submitDate: "2026-03-13"
                },
                {
                  id: 2,
                  name: "김동물 수의사",
                  email: "kim@vet.com",
                  hospital: "행복동물병원",
                  license: "98765-43210",
                  status: "APPROVED",
                  submitDate: "2026-03-01"
                },
              ].map((vet) => (
                <WireframeBox key={vet.id} label={`VET ${vet.id}`} className="bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-mono">
                        [사진]
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{vet.name}</h3>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            vet.status === "PENDING"
                              ? "bg-orange-100 text-orange-700"
                              : vet.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {vet.status === "PENDING" ? "승인 대기" : vet.status === "APPROVED" ? "승인됨" : "거부됨"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>병원: {vet.hospital}</p>
                          <p>이메일: {vet.email}</p>
                          <p>면허번호: {vet.license}</p>
                          <p>신청일: {vet.submitDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    {vet.status === "PENDING" && (
                      <div className="flex gap-2">
                        <WireframeButton variant="primary" className="flex items-center gap-1 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          승인
                        </WireframeButton>
                        <WireframeButton variant="outline" className="flex items-center gap-1 text-sm text-red-600 border-red-400">
                          <XCircle className="w-4 h-4" />
                          거부
                        </WireframeButton>
                      </div>
                    )}
                    
                    {vet.status === "APPROVED" && (
                      <WireframeButton variant="outline" className="text-sm">
                        상세 정보
                      </WireframeButton>
                    )}
                  </div>
                </WireframeBox>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">신고 관리</h2>
              <select className="p-2 border-2 border-gray-300 font-mono text-sm">
                <option>전체</option>
                <option>대기</option>
                <option>처리중</option>
                <option>완료</option>
                <option>기각</option>
              </select>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 1,
                  type: "VET",
                  reporter: "hong@email.com",
                  target: "김동물 수의사",
                  reason: "부적절한 소견 제공",
                  date: "2026-03-13 10:30",
                  status: "PENDING"
                },
                {
                  id: 2,
                  type: "REVIEW",
                  reporter: "kim@email.com",
                  target: "리뷰 #1234",
                  reason: "욕설 및 비방",
                  date: "2026-03-12 15:20",
                  status: "PROCESSING"
                },
              ].map((report) => (
                <WireframeBox key={report.id} label={`REPORT ${report.id}`} className="bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          report.status === "PENDING"
                            ? "bg-orange-100 text-orange-700"
                            : report.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {report.status === "PENDING" ? "대기" : report.status === "PROCESSING" ? "처리중" : "완료"}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                          {report.type === "VET" ? "수의사" : report.type === "USER" ? "사용자" : "리뷰"}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>신고자:</strong> {report.reporter}</p>
                        <p><strong>신고 대상:</strong> {report.target}</p>
                        <p><strong>사유:</strong> {report.reason}</p>
                        <p className="text-gray-500">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <WireframeButton variant="primary" className="text-sm">
                        처리하기
                      </WireframeButton>
                      <WireframeButton variant="outline" className="text-sm">
                        상세보기
                      </WireframeButton>
                    </div>
                  </div>
                </WireframeBox>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
