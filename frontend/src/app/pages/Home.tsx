import { Link } from "react-router";
import { Header } from "../components/Header";
import { Upload, Search, BookOpen, BarChart3, Shield, Sparkles } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-6 text-slate-900 leading-tight">
                반려동물 안구 건강,
                <br />
                <span className="text-blue-600">AI로 미리 확인하세요</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                스마트폰 사진 한 장으로 강아지·고양이 안구 질환을
                사전 스크리닝하고 수의사 소견을 받아보세요
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/upload">
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                    <Upload className="w-4 h-4" />
                    지금 분석하기
                  </button>
                </Link>
                <Link to="/encyclopedia">
                  <button className="px-6 py-3 border border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">
                    질환백과 보기
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <div className="text-6xl mb-4">🐾</div>
              <p className="text-sm">반려동물 눈 검사 이미지</p>
              <p className="text-xs text-slate-300 mt-1">AI 스캔 효과</p>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "20만+", label: "학습 데이터 (AI-Hub)" },
              { value: "15종", label: "질환 동시 스크리닝" },
              { value: "1,500만", label: "반려동물 양육 인구" },
              { value: "무료", label: "AI 사전 스크리닝" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">주요 기능</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles className="w-7 h-7 text-blue-600" />,
                bg: "bg-blue-50",
                title: "AI 멀티태스크 분석",
                desc: "강아지 10종, 고양이 5종 안구 질환을 동시에 검사하고 GradCAM 히트맵으로 병변 위치를 시각화합니다",
              },
              {
                icon: <Search className="w-7 h-7 text-green-600" />,
                bg: "bg-green-50",
                title: "수의사 소견 연계",
                desc: "AI 분석 결과를 기반으로 근처 수의사에게 원격 소견을 요청하고 전문가 의견을 받아볼 수 있습니다",
              },
              {
                icon: <BarChart3 className="w-7 h-7 text-purple-600" />,
                bg: "bg-purple-50",
                title: "검사 이력 관리",
                desc: "반려동물별 검사 기록을 저장하고 시간에 따른 건강 상태 변화를 추적할 수 있습니다",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
                <div className={`w-14 h-14 ${feature.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">이용 방법</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "사진 촬영", desc: "반려동물 눈을 스마트폰으로 촬영" },
              { step: "2", title: "AI 분석", desc: "15종 안구 질환 동시 스크리닝" },
              { step: "3", title: "결과 확인", desc: "GradCAM 히트맵으로 병변 확인" },
              { step: "4", title: "수의사 소견", desc: "필요시 전문가 원격 소견 요청" },
            ].map((item) => (
              <div key={item.step} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 법적 고지 */}
      <section className="py-10 bg-amber-50 border-y border-amber-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 mb-1">법적 고지</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                본 서비스는 수의사법 제10조에 따라 <strong>진단이 아닌 사전 스크리닝 및 소견 제공</strong> 목적입니다.
                최종 진단 및 처방은 반드시 동물병원을 직접 방문하여 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">우리 아이 눈 건강, 지금 확인하세요</h2>
          <p className="text-lg mb-8 opacity-90">5분이면 충분합니다. 무료 AI 분석으로 안심하세요.</p>
          <Link to="/upload">
            <button className="flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 mx-auto">
              <Upload className="w-4 h-4" />
              무료로 시작하기
            </button>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold text-white mb-3">PET EYE AI</div>
              <p className="text-sm">AI 기반 반려동물 안구 질환 사전 스크리닝 플랫폼</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/upload" className="hover:text-white">AI 분석</Link></li>
                <li><Link to="/vets" className="hover:text-white">수의사 찾기</Link></li>
                <li><Link to="/encyclopedia" className="hover:text-white">질환백과</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">지원</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/announcements" className="hover:text-white">공지사항</Link></li>
                <li><Link to="/announcements" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">문의</h4>
              <ul className="space-y-2 text-sm">
                <li>support@peteyeai.com</li>
                <li>사업자등록번호: 000-00-00000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            © 2026 PET EYE AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}