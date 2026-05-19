import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Upload as UploadIcon, Camera, CheckCircle, AlertCircle } from "lucide-react";

export function Upload() {
  const navigate = useNavigate();
  const [selectedPet, setSelectedPet] = useState("");
  const [uploadedImage, setUploadedImage] = useState(false);

  const handleAnalyze = () => {
    navigate("/result/1");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 진행 상태 */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: "1", label: "반려동물 선택", active: true },
              { num: "2", label: "사진 업로드", active: false },
              { num: "3", label: "AI 분석", active: false },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.num}
                  </div>
                  <span className={`text-sm font-medium ${step.active ? "text-slate-900" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && <div className="w-12 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-8 text-center">AI 안구 질환 분석</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 왼쪽 */}
          <div className="space-y-4">
            {/* 반려동물 선택 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">1. 반려동물 선택</h3>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
              >
                <option value="">반려동물을 선택하세요</option>
                <option value="dog1">뽀삐 (강아지, 3세)</option>
                <option value="cat1">나비 (고양이, 2세)</option>
                <option value="dog2">초코 (강아지, 5세)</option>
              </select>
              <Link to="/mypage" className="text-sm text-blue-600 hover:underline">
                + 새 반려동물 등록하기
              </Link>
            </div>

            {/* 사진 업로드 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">2. 눈 사진 업로드</h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center mb-3">
                {!uploadedImage ? (
                  <>
                    <UploadIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-3">
                      클릭하거나 드래그하여 사진 업로드
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="file-upload"
                      onChange={() => setUploadedImage(true)}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                    >
                      파일 선택
                    </label>
                  </>
                ) : (
                  <div>
                    <div className="w-full h-40 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-sm">
                      업로드된 이미지 미리보기
                    </div>
                    <button
                      onClick={() => setUploadedImage(false)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      다시 선택
                    </button>
                  </div>
                )}
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <Camera className="w-4 h-4" />
                카메라로 촬영
              </button>
            </div>

            {/* 분석 버튼 */}
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
              onClick={handleAnalyze}
            >
              AI 분석 시작하기
            </button>
          </div>

          {/* 오른쪽 */}
          <div className="space-y-4">
            {/* 촬영 가이드 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">좋은 사진 촬영 가이드</h3>
              <div className="space-y-3">
                {[
                  { title: "밝은 조명에서 촬영", desc: "자연광이나 밝은 실내 조명 권장" },
                  { title: "눈 부분에 초점", desc: "눈이 화면의 중앙에 크게 보이도록" },
                  { title: "흔들림 없이 선명하게", desc: "흐릿한 사진은 정확도가 낮아집니다" },
                  { title: "정면 촬영 권장", desc: "측면보다는 정면에서 촬영" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="w-full h-24 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center text-green-600 text-xs mb-1">
                    밝고 선명
                  </div>
                  <p className="text-xs text-center text-green-600 font-medium">✓ 권장</p>
                </div>
                <div>
                  <div className="w-full h-24 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center text-red-500 text-xs mb-1">
                    어둡고 흐림
                  </div>
                  <p className="text-xs text-center text-red-500 font-medium">✗ 비권장</p>
                </div>
              </div>
            </div>

            {/* 검출 가능 질환 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">검출 가능 질환</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-blue-600 mb-1">🐕 강아지 (10종)</p>
                  <p className="text-xs text-slate-500">결막염, 각막궤양, 백내장, 녹내장, 유루증, 각막부골편, 각막염, 안검내반증 등</p>
                </div>
                <div>
                  <p className="font-bold text-green-600 mb-1">🐱 고양이 (AI 5개 라벨 · 백과 6건)</p>
                  <p className="text-xs text-slate-500">결막염, 각막궤양, 각막부골편, 유루증 등</p>
                </div>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다. 최종 진단은 반드시 동물병원에서 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}