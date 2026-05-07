import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Search, BookOpen, Dog, Cat } from "lucide-react";

export function DiseaseEncyclopedia() {
  const navigate = useNavigate();
  const [selectedAnimal, setSelectedAnimal] = useState<"ALL" | "DOG" | "CAT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      severity: "경증~중증"
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
      severity: "중증"
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
      severity: "중증"
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
      severity: "응급/중증"
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
      severity: "경증~중증"
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
      severity: "중증"
    },
  ];

  const filteredDiseases = diseases.filter(disease => {
    const matchesAnimal = selectedAnimal === "ALL" || disease.animalType === "ALL" || disease.animalType === selectedAnimal;
    const matchesSearch = disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.englishName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAnimal && matchesSearch;
  });

  const severityStyle = (severity: string) => {
    if (severity.includes("응급") || severity === "중증") return "bg-red-100 text-red-700";
    if (severity === "경증~중증") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">반려동물 안구 질환 백과</h1>
          </div>
          <p className="text-slate-500 text-sm">
            강아지·고양이 주요 안구 질환에 대한 정보를 제공합니다
          </p>
        </div>

        {/* 검색 & 필터 */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="질환명으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {[
              { key: "ALL", label: "전체" },
              { key: "DOG", label: "강아지", icon: <Dog className="w-4 h-4" /> },
              { key: "CAT", label: "고양이", icon: <Cat className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSelectedAnimal(item.key as any)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedAnimal === item.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          총 <strong className="text-slate-900">{filteredDiseases.length}개</strong>의 질환 정보
        </p>

        {/* 질환 카드 */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDiseases.map((disease) => (
            <div
              key={disease.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/encyclopedia/${disease.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5">{disease.name}</h3>
                  <p className="text-xs text-slate-400">{disease.englishName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    {(disease.animalType === "ALL" || disease.animalType === "DOG") && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">🐕 강아지</span>
                    )}
                    {(disease.animalType === "ALL" || disease.animalType === "CAT") && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">🐱 고양이</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityStyle(disease.severity)}`}>
                    {disease.severity}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-3">{disease.description}</p>

              <div className="mb-3">
                <p className="text-xs font-bold text-slate-400 mb-1.5">주요 증상</p>
                <div className="flex flex-wrap gap-1.5">
                  {disease.symptoms.map((symptom, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  ⚠️ 위 정보는 참고용이며, 정확한 진단은 수의사와 상담하세요.
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredDiseases.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}