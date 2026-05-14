import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyPets } from "../../api/pets";
import { getMyDiagnoses } from "../../api/diagnosis";
import { prepareTossPayment } from "../../api/payments";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Header } from "../components/Header";
import { Upload, X, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { format, addHours } from "date-fns";

interface Pet {
  id: number;
  name: string;
  species: string;
  age: number;
}

interface Diagnosis {
  id: number;
  created_at: string;
  main_disease: string;
  main_confidence: number;
  is_normal: boolean;
  pet_id: number;
}

export function OpinionRequest() {
  const { vetId } = useParams();
  const navigate = useNavigate();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [symptomDescription, setSymptomDescription] = useState("");
  const filteredDiagnoses = selectedPet
  ? diagnoses.filter((d) => String(d.pet_id) === String(selectedPet))
  : diagnoses;
  const [isLoading, setIsLoading] = useState(false);
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);

  useEffect(() => {
    getMyPets().then(setPets);
    getMyDiagnoses().then(setDiagnoses);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages((prev) => [...prev, ...files].slice(0, 5));
  };

  const handleRemoveImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedPet) return alert("반려동물을 선택해주세요.");
    if (!selectedDiagnosis) return alert("AI 분석 결과를 선택해주세요.");
    if (!symptomDescription.trim()) return alert("증상을 입력해주세요.");
    if (!agreed1 || !agreed2) return alert("약관에 동의해주세요.");
    try {
      setIsLoading(true);
      const prep = await prepareTossPayment({
        vet_id: parseInt(vetId!),
        diagnosis_id: parseInt(selectedDiagnosis),
        symptom_memo: symptomDescription,
      });
      const tossPayments = await loadTossPayments(prep.clientKey);
      await tossPayments.payment({ customerKey: prep.customerKey }).requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: prep.amount },
        orderId: prep.orderId,
        orderName: prep.orderName,
        successUrl: prep.successUrl,
        failUrl: prep.failUrl,
      });
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string }; status?: number } }).response?.data?.detail
          : undefined;
      const status =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 503) {
        alert(
          detail?.toString() ||
            "결제 모드가 비활성입니다. backend/.env 에 토스 테스트 키(TOSS_PAYMENTS_*)를 설정하세요."
        );
      } else {
        alert(detail?.toString() || "결제 준비에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">수의사 원격 소견 요청</h1>
        <p className="text-sm text-slate-500 mb-8">수의사가 검토 후 24시간 이내 소견을 제공합니다</p>

        <div className="space-y-4">
          {/* 수의사 정보 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                🏥
              </div>
              <div>
                <p className="font-bold text-slate-900">김동물 수의사</p>
                <p className="text-sm text-slate-500">행복동물병원 · 안과 전문 · 경력 15년</p>
                <p className="text-sm text-blue-600 font-bold mt-1">상담료: 30,000원</p>
              </div>
            </div>
          </div>

          {/* 반려동물 선택 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              반려동물 선택 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
            >
              <option value="">반려동물을 선택하세요</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species === "dog" ? "강아지" : "고양이"}, {pet.age}세)
                </option>
              ))}
            </select>
          </div>

          {/* AI 분석 결과 첨부 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              AI 분석 결과 첨부 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
            >
              <option value="">AI 분석 결과를 선택하세요</option>
              {filteredDiagnoses.map((d) => (
                <option key={d.id} value={d.id}>
                  {format(addHours(new Date(d.created_at), 9), "yyyy-MM-dd HH:mm")} -{" "}
                  {d.is_normal ? "정상" : `${d.main_disease} 의심 (${d.main_confidence}%)`}
                </option>
              ))}
            </select>

            {/* AI 결과 요약 카드 */}
            {selectedDiagnosis && (() => {
              const d = diagnoses.find((d) => String(d.id) === String(selectedDiagnosis));
              if (!d) return null;
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                    <FileText className="w-4 h-4" />
                    AI 분석 결과 요약
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">검사일</p>
                      <p className="font-medium text-slate-900">
                        {format(addHours(new Date(d.created_at), 9), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">대표 질환</p>
                      <p className={`font-medium ${d.is_normal ? "text-green-600" : "text-red-600"}`}>
                        {d.is_normal ? "이상 없음" : d.main_disease}
                      </p>
                    </div>
                    {!d.is_normal && (
                      <div>
                        <p className="text-xs text-slate-400">신뢰도</p>
                        <p className="font-medium text-slate-900">{d.main_confidence}%</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white border border-blue-100 rounded-lg text-xs text-green-700">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    원본 이미지 + 히트맵이 자동으로 첨부됩니다
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 증상 설명 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              증상 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm h-40 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={`반려동물의 증상을 자세히 설명해주세요.\n\n예시:\n- 언제부터 증상이 시작되었나요?\n- 어떤 증상이 관찰되나요? (눈곱, 충혈, 눈물 등)\n- 행동 변화가 있나요?\n- 기존 병력이 있나요?`}
              value={symptomDescription}
              onChange={(e) => setSymptomDescription(e.target.value)}
            />
          </div>

          {/* 추가 사진 업로드 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              추가 사진 업로드 <span className="text-slate-400 font-normal">(최대 5장)</span>
            </label>
            {additionalImages.length < 5 && (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center mb-4">
                <Upload className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 mb-3">다양한 각도의 눈 사진을 추가로 올려주세요</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="additional-upload"
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="additional-upload"
                  className="cursor-pointer px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  파일 선택
                </label>
              </div>
            )}
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {additionalImages.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`추가 이미지 ${i + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 중요 안내 */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-900 mb-1">중요 안내</p>
              <ul className="text-amber-800 space-y-1">
                <li>· 본 서비스는 원격 소견 제공이며, 진단이나 처방이 아닙니다</li>
                <li>· 응급 상황의 경우 즉시 동물병원을 방문하시기 바랍니다</li>
                <li>· 소견 제공까지 평균 12~24시간 소요됩니다</li>
                <li>
                  · 토스페이먼츠 <strong>테스트 결제</strong>로 선결제 후 요청이 접수됩니다 (실제 과금 없음)
                </li>
              </ul>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed1}
                onChange={(e) => setAgreed1(e.target.checked)}
              />
              <span className="text-sm text-slate-600">
                본인은 수의사법 제10조에 따라 본 서비스가 진단이 아닌 <strong>원격 소견 제공</strong>임을 이해하였으며, 최종 진단 및 처방은 동물병원 방문을 통해 받을 것임에 동의합니다.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed2}
                onChange={(e) => setAgreed2(e.target.checked)}
              />
              <span className="text-sm text-slate-600">
                개인정보 수집 및 이용에 동의합니다 (필수)
              </span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button
              className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "결제창 여는 중..." : "테스트 결제 후 소견 요청"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}