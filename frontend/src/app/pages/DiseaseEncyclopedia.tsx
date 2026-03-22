import { useState } from "react";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { Search, BookOpen, Dog, Cat } from "lucide-react";

export function DiseaseEncyclopedia() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold">반려동물 안구 질환 백과</h1>
          </div>
          <p className="text-gray-600 text-lg">
            강아지·고양이 주요 안구 질환에 대한 정보를 제공합니다
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="질환명으로 검색..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 font-mono text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedAnimal("ALL")}
              className={`px-6 py-2 border-2 font-mono text-sm flex items-center gap-2 ${
                selectedAnimal === "ALL"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedAnimal("DOG")}
              className={`px-6 py-2 border-2 font-mono text-sm flex items-center gap-2 ${
                selectedAnimal === "DOG"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              <Dog className="w-4 h-4" />
              강아지
            </button>
            <button
              onClick={() => setSelectedAnimal("CAT")}
              className={`px-6 py-2 border-2 font-mono text-sm flex items-center gap-2 ${
                selectedAnimal === "CAT"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              <Cat className="w-4 h-4" />
              고양이
            </button>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-6 font-mono">
          총 <strong>{filteredDiseases.length}개</strong>의 질환 정보
        </p>

        {/* Disease Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDiseases.map((disease) => (
            <WireframeBox key={disease.id} label={`DISEASE ${disease.id}`} className="bg-white">
              <div className="flex gap-4 mb-4">
                <div className="w-32 h-32 bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-mono">
                  [질환 이미지]
                  <br />
                  {disease.name}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{disease.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{disease.englishName}</p>
                    </div>
                    <div className="flex gap-1">
                      {(disease.animalType === "ALL" || disease.animalType === "DOG") && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          🐕 강아지
                        </span>
                      )}
                      {(disease.animalType === "ALL" || disease.animalType === "CAT") && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          🐱 고양이
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`inline-block px-2 py-1 text-xs font-bold rounded mb-2 ${
                    disease.severity.includes("응급") || disease.severity === "중증"
                      ? "bg-red-100 text-red-700"
                      : disease.severity === "경증~중증"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    중증도: {disease.severity}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">📋 설명</h4>
                  <p className="text-gray-700 leading-relaxed">{disease.description}</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-1">🔍 주요 증상</h4>
                  <div className="flex flex-wrap gap-2">
                    {disease.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-1">💊 치료 방법</h4>
                  <p className="text-gray-700">{disease.treatment}</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-1">🛡️ 예방법</h4>
                  <p className="text-gray-700">{disease.prevention}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-yellow-50 -mx-4 -mb-4 px-4 py-3 rounded-b">
                <p className="text-xs text-gray-700">
                  ⚠️ <strong>중요:</strong> 위 정보는 참고용이며, 정확한 진단과 치료는 반드시 수의사와 상담하시기 바랍니다.
                </p>
              </div>
            </WireframeBox>
          ))}
        </div>

        {filteredDiseases.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-mono">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
