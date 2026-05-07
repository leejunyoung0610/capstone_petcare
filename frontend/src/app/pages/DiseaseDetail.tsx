import { useNavigate, useParams, Link } from "react-router";
import { Header } from "../components/Header";
import { ArrowLeft, AlertCircle } from "lucide-react";

const diseases = [
  {
    id: 1,
    name: "결막염",
    englishName: "Conjunctivitis",
    animalType: "ALL",
    description: "결막에 염증이 생긴 상태로 눈의 흰자위가 빨갛게 충혈되고 눈곱이 많이 낍니다.",
    symptoms: ["눈 충혈", "눈곱 증가", "눈물 과다 분비", "눈을 자주 비빔"],
    treatment: "항생제 안약 투여, 소염제 처방, 원인 제거",
    prevention: "눈 주변 청결 유지, 정기적인 검진, 알레르기 원인 파악",
    severity: "경증~중증",
  },
  {
    id: 2,
    name: "각막궤양",
    englishName: "Corneal Ulcer",
    animalType: "ALL",
    description: "각막 표면에 상처가 생겨 궤양이 형성된 상태로, 심한 통증을 동반합니다.",
    symptoms: ["눈을 뜨지 못함", "눈물 과다", "각막 혼탁", "심한 통증"],
    treatment: "항생제 투여, 통증 관리, 심한 경우 수술",
    prevention: "외상 예방, 눈 보호, 정기 검진",
    severity: "중증",
  },
  {
    id: 3,
    name: "백내장",
    englishName: "Cataract",
    animalType: "DOG",
    description: "수정체가 혼탁해져 시력이 저하되는 질환으로, 노령견에게 흔합니다.",
    symptoms: ["수정체 흰색 변화", "시력 저하", "부딪힘", "눈동자 혼탁"],
    treatment: "외과적 수술, 초기 진행 억제 약물",
    prevention: "정기 검진, 유전적 요인 관리, 당뇨병 관리",
    severity: "중증",
  },
  {
    id: 4,
    name: "녹내장",
    englishName: "Glaucoma",
    animalType: "DOG",
    description: "안압 상승으로 인해 시신경이 손상되는 질환으로 응급 상황입니다.",
    symptoms: ["안구 돌출", "심한 통증", "눈 충혈", "동공 확대"],
    treatment: "응급 안압 하강 치료, 수술, 지속적인 관리",
    prevention: "정기 안압 측정, 조기 발견",
    severity: "응급/중증",
  },
  {
    id: 5,
    name: "유루증",
    englishName: "Epiphora",
    animalType: "ALL",
    description: "눈물이 과도하게 분비되어 눈 주변이 젖는 증상입니다.",
    symptoms: ["눈물 자국", "눈 주변 변색", "지속적인 눈물", "눈곱"],
    treatment: "원인 질환 치료, 눈물길 소통, 청결 관리",
    prevention: "눈 주변 청결, 털 관리, 정기 검진",
    severity: "경증~중증",
  },
  {
    id: 6,
    name: "각막부골편",
    englishName: "Corneal Sequestrum",
    animalType: "CAT",
    description: "각막에 검은 반점이 생기는 고양이 특유의 질환입니다.",
    symptoms: ["각막 검은 반점", "눈물", "눈 충혈", "통증"],
    treatment: "외과적 제거, 항생제 투여",
    prevention: "각막 손상 예방, 정기 검진",
    severity: "중증",
  },
];

const severityStyle = (severity: string) => {
  if (severity.includes("응급") || severity === "중증") return "bg-red-100 text-red-700";
  if (severity === "경증~중증") return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
};

export function DiseaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const disease = diseases.find((d) => d.id === Number(id));

  if (!disease) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <p className="text-6xl mb-4">⚠️</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">질환 정보를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate("/encyclopedia")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/encyclopedia")}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {(disease.animalType === "ALL" || disease.animalType === "DOG") && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  🐕 강아지
                </span>
              )}
              {(disease.animalType === "ALL" || disease.animalType === "CAT") && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  🐱 고양이
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityStyle(disease.severity)}`}>
                중증도: {disease.severity}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{disease.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{disease.englishName}</p>
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* 내용 */}
          <div className="space-y-5 text-sm">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">📋 설명</h3>
              <p className="text-slate-600 leading-relaxed">{disease.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">🔍 주요 증상</h3>
              <div className="flex flex-wrap gap-2">
                {disease.symptoms.map((symptom, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">💊 치료 방법</h3>
              <p className="text-slate-600 leading-relaxed">{disease.treatment}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">🛡️ 예방법</h3>
              <p className="text-slate-600 leading-relaxed">{disease.prevention}</p>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              위 정보는 참고용이며, 정확한 진단과 치료는 반드시 수의사와 상담하시기 바랍니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="mt-6 flex gap-3">
            <Link to="/upload" className="flex-1">
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                AI 스크리닝 시작
              </button>
            </Link>
            <Link to="/vets" className="flex-1">
              <button className="w-full py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                수의사 찾기
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}