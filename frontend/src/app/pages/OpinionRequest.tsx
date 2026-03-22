import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Upload, X, AlertCircle, FileText } from "lucide-react";

export function OpinionRequest() {
  const { vetId } = useParams();
  const navigate = useNavigate();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [uploadedImages, setUploadedImages] = useState<number>(0);

  const handleSubmit = () => {
    alert("수의사 소견 요청이 접수되었습니다!");
    navigate("/mypage");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">수의사 원격 소견 요청</h1>
        <p className="text-gray-600 mb-8">
          수의사가 검토 후 24시간 이내 소견을 제공합니다
        </p>

        {/* Vet Info */}
        <WireframeBox label="VET INFO" className="bg-blue-50 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-mono">
              [사진]
            </div>
            <div>
              <h3 className="font-bold text-lg">김동물 수의사</h3>
              <p className="text-sm text-gray-600">행복동물병원 · 안과 전문 · 경력 15년</p>
              <p className="text-sm text-blue-600 font-bold mt-1">상담료: 30,000원</p>
            </div>
          </div>
        </WireframeBox>

        <div className="space-y-6">
          {/* Pet Selection */}
          <WireframeBox label="PET SELECTION">
            <label className="block font-bold mb-3">반려동물 선택 *</label>
            <select className="w-full p-3 border-2 border-gray-300 font-mono text-sm">
              <option>뽀삐 (강아지, 3세)</option>
              <option>나비 (고양이, 2세)</option>
              <option>초코 (강아지, 5세)</option>
            </select>
          </WireframeBox>

          {/* AI Diagnosis Selection */}
          <WireframeBox label="AI DIAGNOSIS ATTACHMENT">
            <label className="block font-bold mb-3">
              AI 분석 결과 첨부 (선택사항)
            </label>
            <select 
              className="w-full p-3 border-2 border-gray-300 font-mono text-sm mb-3"
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
            >
              <option value="">AI 분석 결과를 선택하세요</option>
              <option value="1">2026-03-13 14:32 - 결막염 의심 (87.3%)</option>
              <option value="2">2026-03-10 09:15 - 각막궤양 의심 (76.2%)</option>
            </select>
            
            {selectedDiagnosis && (
              <div className="p-3 bg-green-50 border-2 border-green-300 rounded text-sm">
                <FileText className="inline w-4 h-4 mr-2 text-green-600" />
                AI 분석 결과가 자동으로 첨부됩니다 (원본 이미지 + 히트맵 포함)
              </div>
            )}
          </WireframeBox>

          {/* Symptom Description */}
          <WireframeBox label="SYMPTOM DESCRIPTION">
            <label className="block font-bold mb-3">증상 설명 *</label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-mono text-sm h-40 resize-none"
              placeholder="반려동물의 증상을 자세히 설명해주세요.&#10;&#10;예시:&#10;- 언제부터 증상이 시작되었나요?&#10;- 어떤 증상이 관찰되나요? (눈곱, 충혈, 눈물 등)&#10;- 행동 변화가 있나요?&#10;- 기존 병력이 있나요?"
            ></textarea>
          </WireframeBox>

          {/* Additional Images */}
          <WireframeBox label="ADDITIONAL IMAGES">
            <label className="block font-bold mb-3">
              추가 사진 업로드 (최대 5장)
            </label>
            
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white mb-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="font-mono text-sm text-gray-600 mb-3">
                다양한 각도의 눈 사진을 추가로 올려주세요
              </p>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                className="hidden"
                id="additional-upload"
                onChange={(e) => setUploadedImages(e.target.files?.length || 0)}
              />
              <label htmlFor="additional-upload">
                <WireframeButton variant="outline" className="cursor-pointer">
                  파일 선택
                </WireframeButton>
              </label>
            </div>

            {uploadedImages > 0 && (
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: uploadedImages }).map((_, i) => (
                  <div key={i} className="relative">
                    <div className="w-full h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-mono">
                      IMG {i + 1}
                    </div>
                    <button className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </WireframeBox>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-yellow-900 mb-1">중요 안내</p>
              <ul className="list-disc list-inside text-yellow-800 space-y-1">
                <li>본 서비스는 원격 소견 제공이며, 진단이나 처방이 아닙니다</li>
                <li>응급 상황의 경우 즉시 동물병원을 방문하시기 바랍니다</li>
                <li>소견 제공까지 평균 12~24시간 소요됩니다</li>
                <li>결제는 소견 제공 후 진행됩니다</li>
              </ul>
            </div>
          </div>

          {/* Terms Agreement */}
          <WireframeBox label="AGREEMENT">
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">
                  본인은 수의사법 제10조에 따라 본 서비스가 진단이 아닌 <strong>원격 소견 제공</strong>임을 이해하였으며, 
                  최종 진단 및 처방은 동물병원 방문을 통해 받을 것임에 동의합니다.
                </span>
              </label>
              
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">
                  개인정보 수집 및 이용에 동의합니다 (필수)
                </span>
              </label>
            </div>
          </WireframeBox>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <WireframeButton 
              variant="secondary" 
              className="flex-1 py-3"
              onClick={() => navigate(-1)}
            >
              취소
            </WireframeButton>
            <WireframeButton 
              variant="primary" 
              className="flex-1 py-3 text-base"
              onClick={handleSubmit}
            >
              소견 요청하기 (30,000원)
            </WireframeButton>
          </div>
        </div>
      </div>
    </div>
  );
}
