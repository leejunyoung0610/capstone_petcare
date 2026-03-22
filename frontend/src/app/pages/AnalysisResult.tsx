import { Link } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { AlertCircle, CheckCircle, Download, Share2, Calendar, FileText } from "lucide-react";

export function AnalysisResult() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">AI 분석 결과</h1>
            <div className="flex gap-3">
              <WireframeButton variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                PDF 저장
              </WireframeButton>
              <WireframeButton variant="outline" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                공유
              </WireframeButton>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 font-mono">
            <span>반려동물: 뽀삐 (강아지, 3세)</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              2026-03-13 14:32
            </span>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded-lg mb-8 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-900 mb-1">이상 징후가 감지되었습니다</p>
            <p className="text-sm text-orange-800">
              AI가 안구 질환 가능성을 발견했습니다. 정확한 진단을 위해 동물병원 방문을 권장합니다.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-6">
            <WireframeBox label="ORIGINAL IMAGE">
              <h3 className="font-bold mb-4">원본 이미지</h3>
              <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-sm">
                [원본 눈 사진]
                <br />
                업로드된 이미지 표시
              </div>
            </WireframeBox>

            <WireframeBox label="GRADCAM HEATMAP" className="bg-red-50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                GradCAM 히트맵
              </h3>
              <div className="w-full h-80 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 flex items-center justify-center text-white font-mono text-sm">
                [GradCAM 히트맵]
                <br />
                병변 위치 시각화
                <br />
                (빨간색 = 고신뢰 영역)
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-400"></div>
                  <span>낮음</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-400"></div>
                  <span>중간</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-400"></div>
                  <span>높음</span>
                </div>
              </div>
            </WireframeBox>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            {/* Main Disease */}
            <WireframeBox label="PRIMARY DIAGNOSIS" className="bg-red-50 border-red-400">
              <h3 className="font-bold mb-4 text-red-700">대표 질환</h3>
              <div className="bg-white p-4 rounded border-2 border-red-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-xl font-bold text-red-700">결막염</h4>
                    <p className="text-sm text-gray-600 mt-1">Conjunctivitis</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">87.3%</div>
                    <div className="text-xs text-gray-500">신뢰도</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>중증도</span>
                    <span className="font-bold text-orange-600">중등도</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-2/3"></div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  눈 결막에 염증이 발생한 상태로, 충혈, 눈곱, 눈물 과다 분비 등의 증상이 나타납니다.
                </div>
              </div>
            </WireframeBox>

            {/* All Predictions */}
            <WireframeBox label="ALL PREDICTIONS">
              <h3 className="font-bold mb-4">전체 질환 확률 (멀티태스크 출력)</h3>
              <div className="space-y-3">
                {[
                  { name: "결막염", value: 87.3, color: "red" },
                  { name: "각막궤양", value: 34.2, color: "orange" },
                  { name: "유루증", value: 28.7, color: "yellow" },
                  { name: "각막염", value: 15.4, color: "gray" },
                  { name: "백내장", value: 8.2, color: "gray" },
                  { name: "녹내장", value: 3.1, color: "gray" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${item.color}-500`}
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 font-mono">
                * AI-Hub 20만 장 데이터 기반 멀티태스크 학습 모델
              </p>
            </WireframeBox>

            {/* Recommended Actions */}
            <WireframeBox label="RECOMMENDATIONS" className="bg-blue-50">
              <h3 className="font-bold mb-4">권장 조치</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-bold text-sm">동물병원 방문</p>
                    <p className="text-xs text-gray-600">3일 이내 수의사 진료 권장</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-bold text-sm">눈 주변 청결 유지</p>
                    <p className="text-xs text-gray-600">따뜻한 물로 눈곱 제거</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-bold text-sm">증상 관찰</p>
                    <p className="text-xs text-gray-600">충혈, 분비물 증가 여부 체크</p>
                  </div>
                </div>
              </div>
            </WireframeBox>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link to="/vets" className="flex-1">
                <WireframeButton variant="primary" className="w-full">
                  근처 수의사 찾기
                </WireframeButton>
              </Link>
              <Link to="/encyclopedia" className="flex-1">
                <WireframeButton variant="outline" className="w-full flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  질환 상세정보
                </WireframeButton>
              </Link>
            </div>

            <Link to="/opinion-request/1">
              <WireframeButton variant="secondary" className="w-full">
                수의사 원격 소견 요청하기
              </WireframeButton>
            </Link>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 border-2 border-gray-300 rounded">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>법적 고지:</strong> 본 AI 분석 결과는 사전 스크리닝 목적의 참고자료이며, 
            의료기기가 아닙니다. 수의사법 제10조에 따라 본 서비스는 진단이 아닌 소견 제공 형태로 운영됩니다. 
            최종 진단 및 처방은 반드시 동물병원을 직접 방문하여 수의사에게 받으시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
