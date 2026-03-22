import { Link } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Upload, Search, BookOpen, BarChart3, Shield, Sparkles } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                반려동물 안구 건강,
                <br />
                <span className="text-blue-600">AI로 미리 확인하세요</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                스마트폰 사진 한 장으로 강아지·고양이 안구 질환을
                <br />
                사전 스크리닝하고 수의사 소견을 받아보세요
              </p>
              <div className="flex gap-4">
                <Link to="/upload">
                  <WireframeButton variant="primary" className="text-base px-8 py-3">
                    <Upload className="inline w-5 h-5 mr-2" />
                    지금 분석하기
                  </WireframeButton>
                </Link>
                <Link to="/encyclopedia">
                  <WireframeButton variant="outline" className="text-base px-8 py-3">
                    질환백과 보기
                  </WireframeButton>
                </Link>
              </div>
            </div>
            
            <WireframeBox label="HERO IMAGE" className="h-96">
              <div className="h-full flex items-center justify-center text-gray-400 font-mono">
                [반려동물 눈 검사 이미지]
                <br />
                애완견/고양이 + AI 스캔 효과
              </div>
            </WireframeBox>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">20만+</div>
              <div className="text-gray-600 font-mono text-sm">학습 데이터 (AI-Hub)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">15종</div>
              <div className="text-gray-600 font-mono text-sm">질환 동시 스크리닝</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1,500만</div>
              <div className="text-gray-600 font-mono text-sm">반려동물 양육 인구</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">무료</div>
              <div className="text-gray-600 font-mono text-sm">AI 사전 스크리닝</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <WireframeBox label="FEATURE 1">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI 멀티태스크 분석</h3>
                <p className="text-gray-600 text-sm">
                  강아지 10종, 고양이 5종 안구 질환을 
                  동시에 검사하고 GradCAM 히트맵으로 
                  병변 위치를 시각화합니다
                </p>
              </div>
            </WireframeBox>

            <WireframeBox label="FEATURE 2">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">수의사 소견 연계</h3>
                <p className="text-gray-600 text-sm">
                  AI 분석 결과를 기반으로 근처 수의사에게
                  원격 소견을 요청하고 전문가 의견을
                  받아볼 수 있습니다
                </p>
              </div>
            </WireframeBox>

            <WireframeBox label="FEATURE 3">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">검사 이력 관리</h3>
                <p className="text-gray-600 text-sm">
                  반려동물별 검사 기록을 저장하고
                  시간에 따른 건강 상태 변화를
                  추적할 수 있습니다
                </p>
              </div>
            </WireframeBox>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">이용 방법</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "사진 촬영", desc: "반려동물 눈을 스마트폰으로 촬영" },
              { step: "2", title: "AI 분석", desc: "15종 안구 질환 동시 스크리닝" },
              { step: "3", title: "결과 확인", desc: "GradCAM 히트맵으로 병변 확인" },
              { step: "4", title: "수의사 소견", desc: "필요시 전문가 원격 소견 요청" }
            ].map((item) => (
              <div key={item.step} className="bg-white p-6 rounded-lg border-2 border-gray-300">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="py-12 bg-yellow-50 border-y-2 border-yellow-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">법적 고지</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                본 서비스는 수의사법 제10조에 따라 <strong>진단이 아닌 사전 스크리닝 및 소견 제공</strong> 목적입니다. 
                최종 진단 및 처방은 반드시 동물병원을 직접 방문하여 받으시기 바랍니다.
                본 플랫폼은 의료기기가 아니며, AI 분석 결과는 참고용입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">우리 아이 눈 건강, 지금 확인하세요</h2>
          <p className="text-xl mb-8 opacity-90">
            5분이면 충분합니다. 무료 AI 분석으로 안심하세요.
          </p>
          <Link to="/upload">
            <WireframeButton variant="outline" className="bg-white text-blue-600 border-white text-lg px-10 py-4">
              <Upload className="inline w-5 h-5 mr-2" />
              무료로 시작하기
            </WireframeButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-mono text-lg font-bold text-white mb-4">[PET EYE AI]</div>
              <p className="text-sm">
                AI 기반 반려동물 안구 질환
                <br />
                사전 스크리닝 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/upload">AI 분석</Link></li>
                <li><Link to="/vets">수의사 찾기</Link></li>
                <li><Link to="/encyclopedia">질환백과</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">지원</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#">공지사항</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">이용약관</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">문의</h4>
              <ul className="space-y-2 text-sm">
                <li>support@peteyeai.com</li>
                <li>사업자등록번호: 000-00-00000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2026 PET EYE AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
