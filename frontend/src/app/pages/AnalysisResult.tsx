import { Link } from "react-router";
import { Header } from "../components/Header";
import { AlertCircle, Download, Share2, Calendar, FileText } from "lucide-react";

export function AnalysisResult() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-slate-900">AI 분석 결과</h1>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4" />
                PDF 저장
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <Share2 className="w-4 h-4" />
                공유
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>반려동물: 뽀삐 (강아지, 3세)</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              2026-03-13 14:32
            </span>
          </div>
        </div>

        {/* 경고 배너 */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-900 text-sm mb-0.5">이상 징후가 감지되었습니다</p>
            <p className="text-sm text-orange-700">
              AI가 안구 질환 가능성을 발견했습니다. 정확한 진단을 위해 동물병원 방문을 권장합니다.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 왼쪽 - 이미지 */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">원본 이미지</h3>
              <div className="w-full h-72 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <p className="text-xs">원본 눈 사진</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                GradCAM 히트맵
              </h3>
              <div className="w-full h-72 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-lg flex flex-col items-center justify-center text-white text-sm">
                <p>병변 위치 시각화</p>
                <p className="text-xs opacity-80 mt-1">(빨간색 = 고신뢰 영역)</p>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 낮음</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 중간</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> 높음</span>
              </div>
            </div>
          </div>

          {/* 오른쪽 - 분석 결과 */}
          <div className="space-y-4">
            {/* 대표 질환 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-red-400 mb-3">대표 질환</p>
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-red-700">결막염</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Conjunctivitis</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">87.3%</div>
                    <div className="text-xs text-slate-400">신뢰도</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">중증도</span>
                    <span className="font-bold text-orange-600">중등도</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-2/3 rounded-full" />
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  눈 결막에 염증이 발생한 상태로, 충혈, 눈곱, 눈물 과다 분비 등의 증상이 나타납니다.
                </p>
              </div>
            </div>

            {/* 전체 질환 확률 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 mb-3">전체 질환 확률</p>
              <div className="space-y-2.5">
                {[
                  { name: "결막염", value: 87.3, color: "bg-red-500" },
                  { name: "각막궤양", value: 34.2, color: "bg-orange-500" },
                  { name: "유루증", value: 28.7, color: "bg-amber-500" },
                  { name: "각막염", value: 15.4, color: "bg-slate-300" },
                  { name: "백내장", value: 8.2, color: "bg-slate-300" },
                  { name: "녹내장", value: 3.1, color: "bg-slate-300" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-bold text-slate-900">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">* AI-Hub 20만 장 데이터 기반 멀티태스크 학습 모델</p>
            </div>

            {/* 권장 조치 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-blue-400 mb-3">권장 조치</p>
              <div className="space-y-3">
                {[
                  { num: "1", title: "동물병원 방문", desc: "3일 이내 수의사 진료 권장" },
                  { num: "2", title: "눈 주변 청결 유지", desc: "따뜻한 물로 눈곱 제거" },
                  { num: "3", title: "증상 관찰", desc: "충혈, 분비물 증가 여부 체크" },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {item.num}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Link to="/vets" className="flex-1">
                <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  근처 수의사 찾기
                </button>
              </Link>
              <Link to="/encyclopedia" className="flex-1">
                <button className="w-full py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  질환 상세정보
                </button>
              </Link>
            </div>

            <Link to="/opinion-request/1">
              <button className="w-full py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                수의사 원격 소견 요청하기
              </button>
            </Link>
          </div>
        </div>

        {/* 법적 고지 */}
        <div className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>법적 고지:</strong> 본 AI 분석 결과는 사전 스크리닝 목적의 참고자료이며, 의료기기가 아닙니다.
            수의사법 제10조에 따라 본 서비스는 진단이 아닌 소견 제공 형태로 운영됩니다.
            최종 진단 및 처방은 반드시 동물병원을 직접 방문하여 수의사에게 받으시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}