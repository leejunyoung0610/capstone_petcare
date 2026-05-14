export interface Disease {
  id: number;
  name: string;
  englishName: string;
  animalType: "ALL" | "DOG" | "CAT";
  description: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  severity: string;
}

const diseases: Disease[] = [
  // ── 강아지 + 고양이 공통 ──
  {
    id: 1,
    name: "결막염",
    englishName: "Conjunctivitis",
    animalType: "ALL",
    description:
      "결막에 염증이 생긴 상태로 눈의 흰자위가 빨갛게 충혈되고 눈곱이 많이 낍니다. 세균·바이러스·알레르기 등 다양한 원인으로 발생하며, 방치 시 각막까지 파급될 수 있습니다.",
    symptoms: ["눈 충혈", "눈곱 증가", "눈물 과다 분비", "눈을 자주 비빔"],
    treatment: "항생제 안약 투여, 소염제 처방, 원인 제거",
    prevention: "눈 주변 청결 유지, 정기적인 검진, 알레르기 원인 파악",
    severity: "경증~중증",
  },
  {
    id: 2,
    name: "안검염",
    englishName: "Blepharitis",
    animalType: "ALL",
    description:
      "눈꺼풀(안검)에 염증이 생기는 질환으로, 세균 감염·기생충·알레르기·자가면역 등이 원인입니다. 눈꺼풀이 붓고 빨개지며 가려움을 동반합니다.",
    symptoms: ["눈꺼풀 부종", "눈꺼풀 발적", "눈곱", "눈 주변 탈모·각질"],
    treatment: "원인별 항생제·항진균제 투여, 온찜질, 눈꺼풀 세정",
    prevention: "눈 주변 위생 관리, 정기 검진, 알레르기 관리",
    severity: "경증~중증",
  },
  {
    id: 3,
    name: "유루증",
    englishName: "Epiphora",
    animalType: "ALL",
    description:
      "눈물이 과도하게 분비되거나 눈물길이 막혀 눈 주변이 항상 젖는 증상입니다. 눈물 자국이 갈색·적갈색으로 변색되기도 합니다.",
    symptoms: ["눈물 자국", "눈 주변 변색", "지속적인 눈물", "눈곱"],
    treatment: "원인 질환 치료, 눈물길 소통술, 청결 관리",
    prevention: "눈 주변 청결, 털 관리, 정기 검진",
    severity: "경증~중증",
  },

  // ── 강아지 전용 ──
  {
    id: 4,
    name: "궤양성각막질환",
    englishName: "Ulcerative Keratitis",
    animalType: "DOG",
    description:
      "각막 표면에 상처나 궤양이 형성되는 질환입니다. 외상·건조·감염 등이 원인이며 심한 통증을 유발하고, 방치 시 천공 위험이 있습니다.",
    symptoms: ["눈을 뜨지 못함", "눈물 과다", "각막 혼탁", "심한 통증"],
    treatment: "항생제 안약, 통증 관리, 심한 경우 각막 이식술",
    prevention: "외상 예방, 건조 환경 개선, 정기 검진",
    severity: "중증",
  },
  {
    id: 5,
    name: "비궤양성각막질환",
    englishName: "Non-ulcerative Keratitis",
    animalType: "DOG",
    description:
      "궤양 없이 각막에 염증이 생기는 질환군입니다. 면역 매개·만성 자극 등이 원인이며, 각막이 혼탁해지거나 혈관 신생이 나타납니다.",
    symptoms: ["각막 혼탁", "혈관 신생", "시력 저하", "눈 충혈"],
    treatment: "소염·면역 억제 안약, 원인 인자 제거",
    prevention: "자극 요인 관리, 정기 안과 검진",
    severity: "경증~중증",
  },
  {
    id: 6,
    name: "백내장",
    englishName: "Cataract",
    animalType: "DOG",
    description:
      "수정체가 혼탁해져 시력이 저하되는 질환으로, 노령견·당뇨견에게 흔합니다. 초기→비성숙→성숙 단계로 진행되며 실명에 이를 수 있습니다.",
    symptoms: ["수정체 흰색 변화", "시력 저하", "물건에 부딪힘", "눈동자 혼탁"],
    treatment: "외과적 수술(수정체 유화술), 초기 진행 억제 약물",
    prevention: "정기 검진, 유전적 요인 관리, 당뇨병 관리",
    severity: "중증",
  },
  {
    id: 7,
    name: "핵경화",
    englishName: "Nuclear Sclerosis",
    animalType: "DOG",
    description:
      "노화로 인해 수정체 핵이 단단해지면서 푸르스름하게 혼탁해 보이는 현상입니다. 백내장과 외형이 비슷하지만 시력에 큰 영향이 없어 구별이 중요합니다.",
    symptoms: ["수정체 청백색 변화", "경미한 시력 감소", "노령견에 호발"],
    treatment: "대부분 치료 불필요, 백내장 진행 여부 모니터링",
    prevention: "정기 안과 검진, 노령견 건강 관리",
    severity: "경증",
  },
  {
    id: 8,
    name: "색소침착성각막염",
    englishName: "Pigmentary Keratitis",
    animalType: "DOG",
    description:
      "각막 표면에 멜라닌 색소가 침착되어 갈색·검은색 반점이 생기는 질환입니다. 만성 자극·건성안·안검 이상 등이 원인이며, 퍼그·시츄 등 단두종에 호발합니다.",
    symptoms: ["각막 갈색/검은 반점", "시력 저하", "눈물 과다", "눈 충혈"],
    treatment: "원인 제거, 면역 억제 안약(사이클로스포린), 인공 눈물",
    prevention: "단두종 정기 검진, 건조 환경 개선, 자극 요인 관리",
    severity: "경증~중증",
  },
  {
    id: 9,
    name: "안검내반증",
    englishName: "Entropion",
    animalType: "DOG",
    description:
      "눈꺼풀이 안쪽으로 말려 속눈썹이 각막을 자극하는 구조적 질환입니다. 유전적 소인이 크며 샤페이·불독 등에 호발합니다. 만성 각막 손상의 원인이 됩니다.",
    symptoms: ["눈물 과다", "눈을 자주 깜빡임", "눈 충혈", "각막 상처"],
    treatment: "외과적 교정술(안검성형술), 보호 안약",
    prevention: "번식 전 검사, 조기 발견 시 교정",
    severity: "중증",
  },
  {
    id: 10,
    name: "안검종양",
    englishName: "Eyelid Tumor",
    animalType: "DOG",
    description:
      "눈꺼풀에 발생하는 종양으로, 노령견에서 흔합니다. 대부분 양성(마이봄선종 등)이지만 크기가 커지면 각막을 자극하므로 조기 제거가 권장됩니다.",
    symptoms: ["눈꺼풀 혹/덩어리", "눈물 증가", "눈곱", "눈 불편감"],
    treatment: "외과적 절제, 냉동수술, 병리 조직검사",
    prevention: "정기 검진, 초기 발견 시 조기 제거",
    severity: "경증~중증",
  },

  // ── 고양이 전용 ──
  {
    id: 11,
    name: "각막궤양",
    englishName: "Corneal Ulcer",
    animalType: "CAT",
    description:
      "각막 표면에 상처가 생겨 궤양이 형성된 상태입니다. 고양이에서는 헤르페스바이러스 감염이 주요 원인이며, 심한 통증과 눈물을 동반합니다.",
    symptoms: ["눈을 뜨지 못함", "눈물 과다", "각막 혼탁", "심한 통증"],
    treatment: "항바이러스·항생제 안약, 통증 관리, 심한 경우 수술",
    prevention: "스트레스 관리, 헤르페스 재발 방지, 정기 검진",
    severity: "중증",
  },
  {
    id: 12,
    name: "각막부골편",
    englishName: "Corneal Sequestrum",
    animalType: "CAT",
    description:
      "각막에 갈색~검은색 괴사 조직이 형성되는 고양이 특유의 질환입니다. 만성 각막 자극·헤르페스 감염 이후 발생하며, 페르시안·히말라얀 등에 호발합니다.",
    symptoms: ["각막 검은 반점", "눈물", "눈 충혈", "통증·눈 깜빡임"],
    treatment: "외과적 절제(표층 각막 절제술), 항생제 투여",
    prevention: "각막 손상 예방, 헤르페스 관리, 정기 검진",
    severity: "중증",
  },
  {
    id: 13,
    name: "비궤양성각막염",
    englishName: "Non-ulcerative Keratitis",
    animalType: "CAT",
    description:
      "궤양 없이 각막에 염증이 생기는 질환입니다. 고양이에서는 호산구성 각막염이 대표적이며, 각막 표면에 흰색~분홍색 플라크가 나타납니다.",
    symptoms: ["각막 흰색/분홍 플라크", "혈관 신생", "눈물", "눈 충혈"],
    treatment: "스테로이드·면역 억제 안약, 항바이러스제(헤르페스 동반 시)",
    prevention: "면역 관리, 스트레스 최소화, 정기 안과 검진",
    severity: "경증~중증",
  },
];

export default diseases;
