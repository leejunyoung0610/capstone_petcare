import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Upload as UploadIcon, Camera, Info, CheckCircle } from "lucide-react";

export function Upload() {
  const navigate = useNavigate();
  const [selectedPet, setSelectedPet] = useState("");
  const [uploadedImage, setUploadedImage] = useState(false);

  const handleAnalyze = () => {
    // Mock navigation to result page
    navigate("/result/1");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <span className="font-mono text-sm">반려동물 선택</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <span className="font-mono text-sm text-gray-400">사진 업로드</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <span className="font-mono text-sm text-gray-400">AI 분석</span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">AI 안구 질환 분석</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Pet Selection */}
            <WireframeBox label="PET SELECTOR">
              <h3 className="font-bold mb-4">1. 반려동물 선택</h3>
              <div className="space-y-3">
                <select 
                  className="w-full p-3 border-2 border-gray-300 font-mono text-sm"
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                >
                  <option value="">반려동물을 선택하세요</option>
                  <option value="dog1">뽀삐 (강아지, 3세)</option>
                  <option value="cat1">나비 (고양이, 2세)</option>
                  <option value="dog2">초코 (강아지, 5세)</option>
                </select>
                <Link to="/mypage" className="text-sm text-blue-600 hover:underline block">
                  + 새 반려동물 등록하기
                </Link>
              </div>
            </WireframeBox>

            {/* Upload Area */}
            <WireframeBox label="IMAGE UPLOAD">
              <h3 className="font-bold mb-4">2. 눈 사진 업로드</h3>
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white">
                {!uploadedImage ? (
                  <>
                    <UploadIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="font-mono text-sm text-gray-600 mb-4">
                      클릭하거나 드래그하여 사진 업로드
                    </p>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="file-upload"
                      onChange={() => setUploadedImage(true)}
                    />
                    <label htmlFor="file-upload">
                      <WireframeButton variant="outline" className="cursor-pointer">
                        파일 선택
                      </WireframeButton>
                    </label>
                  </>
                ) : (
                  <div>
                    <div className="w-full h-48 bg-gray-200 mb-4 flex items-center justify-center text-gray-500 font-mono text-sm">
                      [업로드된 이미지 미리보기]
                    </div>
                    <button 
                      onClick={() => setUploadedImage(false)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      다시 선택
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <WireframeButton variant="outline" className="flex-1 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  카메라로 촬영
                </WireframeButton>
              </div>
            </WireframeBox>

            {/* Analyze Button */}
            <WireframeButton 
              variant="primary" 
              className="w-full py-4 text-base"
              onClick={handleAnalyze}
            >
              AI 분석 시작하기
            </WireframeButton>
          </div>

          {/* Right Column - Guidelines */}
          <div className="space-y-6">
            <WireframeBox label="PHOTO GUIDELINES">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                좋은 사진 촬영 가이드
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">밝은 조명에서 촬영</p>
                    <p className="text-xs text-gray-600">자연광이나 밝은 실내 조명 권장</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">눈 부분에 초점</p>
                    <p className="text-xs text-gray-600">눈이 화면의 중앙에 크게 보이도록</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">흔들림 없이 선명하게</p>
                    <p className="text-xs text-gray-600">흐릿한 사진은 정확도가 낮아집니다</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">정면 촬영 권장</p>
                    <p className="text-xs text-gray-600">측면보다는 정면에서 촬영</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="w-full h-32 bg-green-100 border-2 border-green-500 flex items-center justify-center text-green-700 font-mono text-xs mb-2">
                    [좋은 예시]
                    <br />
                    밝고 선명
                  </div>
                  <p className="text-xs text-center text-green-600 font-bold">✓ 권장</p>
                </div>
                <div>
                  <div className="w-full h-32 bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-700 font-mono text-xs mb-2">
                    [나쁜 예시]
                    <br />
                    어둡고 흐림
                  </div>
                  <p className="text-xs text-center text-red-600 font-bold">✗ 비권장</p>
                </div>
              </div>
            </WireframeBox>

            <WireframeBox label="DETECTABLE DISEASES" className="bg-blue-50">
              <h3 className="font-bold mb-4">검출 가능 질환</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-blue-600 mb-1">강아지 (10종)</p>
                  <p className="text-xs text-gray-600">
                    결막염, 각막궤양, 백내장, 녹내장, 유루증, 
                    각막부골편, 각막염, 안검내반증 등
                  </p>
                </div>
                <div>
                  <p className="font-bold text-green-600 mb-1">고양이 (5종)</p>
                  <p className="text-xs text-gray-600">
                    결막염, 각막궤양, 각막부골편, 유루증 등
                  </p>
                </div>
              </div>
            </WireframeBox>

            <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded">
              <p className="text-xs text-gray-700">
                <strong>알림:</strong> 본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다. 
                최종 진단은 반드시 동물병원에서 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
