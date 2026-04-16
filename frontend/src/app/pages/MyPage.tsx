import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { authAPI } from "../../api/auth";
import { getMyPets } from "../../api/pets";
import { getMyOpinions } from "../../api/opinions";
import useAuthStore from "../../stores/authStore";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import {
  PawPrint, FileText, MessageCircle, Settings,
  Calendar, Eye, Plus, LogOut
} from "lucide-react";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
}

interface Opinion {
  id: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
  vet: { name: string; hospital_name: string };
  pet: { name: string };
}

/** 백엔드 OpinionDetailResponse(평탄 필드) → 마이페이지 카드용 */
function mapOpinionRow(o: {
  id: number;
  content?: string | null;
  created_at: string;
  vet_name?: string | null;
  hospital_name?: string | null;
  pet_name?: string | null;
}): Opinion {
  const done = o.content != null && String(o.content).length > 0;
  return {
    id: o.id,
    status: done ? "COMPLETED" : "PENDING",
    created_at: o.created_at,
    vet: {
      name: o.vet_name ?? "",
      hospital_name: o.hospital_name ?? "",
    },
    pet: { name: o.pet_name ?? "" },
  };
}

interface UserProfile {
  email: string;
  nickname: string;
}

export function MyPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<"pets" | "opinions" | "settings">("pets");
  const [pets, setPets] = useState<Pet[]>([]);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    authAPI
      .getMe()
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setNickname(res.data.nickname);
        setPhone(res.data.phone || "");
      })
      .catch(() => {
        /* 401 시 client 가 /login 으로 이동 */
      });
    getMyPets().then((data) => {
      if (!cancelled) setPets(data);
    }).catch(() => {});
    getMyOpinions()
      .then((rows) => {
        if (!cancelled) setOpinions(Array.isArray(rows) ? rows.map(mapOpinionRow) : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    try {
      setIsSaving(true);
      await authAPI.updateMe({ nickname, phone });
      setProfile((prev) => prev ? { ...prev, nickname } : prev);
      alert("프로필이 수정되었습니다.");
    } catch {
      alert("프로필 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 프로필 헤더 */}
        <WireframeBox label="USER PROFILE" className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-mono">
                [프로필]
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {profile?.nickname || "로딩 중..."} 님
                </h1>
                <p className="text-gray-600 mb-2">{profile?.email}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <PawPrint className="w-4 h-4" />
                    반려동물 {pets.length}마리
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    소견 {opinions.length}회
                  </span>
                </div>
              </div>
            </div>
            <WireframeButton
              variant="secondary"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </WireframeButton>
          </div>
        </WireframeBox>

        {/* 탭 */}
        <div className="border-b-2 border-gray-300 mb-8">
          <div className="flex gap-2">
            {[
              { key: "pets", label: "반려동물 관리", icon: PawPrint },
              { key: "opinions", label: "수의사 소견", icon: MessageCircle },
              { key: "settings", label: "설정", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 border-2 border-b-0 font-mono text-sm flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-white border-gray-300 border-b-white -mb-0.5 relative z-10"
                    : "bg-gray-100 border-transparent text-gray-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 반려동물 관리 탭 */}
        {activeTab === "pets" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">내 반려동물</h2>
              <Link to="/pets/new">
                <WireframeButton variant="primary" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  반려동물 추가
                </WireframeButton>
              </Link>
            </div>

            {pets.length === 0 ? (
              <WireframeBox label="PETS" className="text-center py-16">
                <PawPrint className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">등록된 반려동물이 없습니다</p>
                <Link to="/pets/new">
                  <WireframeButton variant="primary">반려동물 등록하기</WireframeButton>
                </Link>
              </WireframeBox>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <WireframeBox key={pet.id} label={`PET ${pet.id}`} className="bg-white">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500 text-xs font-mono">
                        [사진]
                      </div>
                      <h3 className="text-xl font-bold mb-1">{pet.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {pet.species === "DOG" ? "🐕 강아지" : "🐱 고양이"} · {pet.breed} · {pet.age}세
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/pets/${pet.id}/edit`} className="flex-1">
                          <WireframeButton variant="outline" className="w-full text-sm py-2">
                            수정
                          </WireframeButton>
                        </Link>
                        <Link to="/upload" className="flex-1">
                          <WireframeButton variant="primary" className="w-full text-sm py-2">
                            검사하기
                          </WireframeButton>
                        </Link>
                      </div>
                    </div>
                  </WireframeBox>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 수의사 소견 탭 */}
        {activeTab === "opinions" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">수의사 소견 내역</h2>

            {opinions.length === 0 ? (
              <WireframeBox label="OPINIONS" className="text-center py-16">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">소견 내역이 없습니다</p>
                <Link to="/vets">
                  <WireframeButton variant="primary">수의사 찾기</WireframeButton>
                </Link>
              </WireframeBox>
            ) : (
              <div className="space-y-4">
                {opinions.map((opinion) => (
                  <WireframeBox key={opinion.id} label={`OPINION ${opinion.id}`} className="bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{opinion.vet.name}</h3>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            opinion.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : opinion.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {opinion.status === "COMPLETED" ? "완료"
                              : opinion.status === "IN_PROGRESS" ? "진행중"
                              : opinion.status === "CANCELLED" ? "취소"
                              : "대기"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{opinion.vet.hospital_name}</p>
                        <p className="text-sm text-gray-600">반려동물: {opinion.pet.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {opinion.created_at.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    {opinion.status === "COMPLETED" && (
                      <Link to={`/opinions/${opinion.id}`}>
                        <WireframeButton variant="outline" className="text-sm">
                          <Eye className="inline w-4 h-4 mr-1" />
                          소견 상세보기
                        </WireframeButton>
                      </Link>
                    )}

                    {opinion.status === "IN_PROGRESS" && (
                      <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded text-sm text-yellow-800">
                        수의사가 검토 중입니다. 평균 12~24시간 내 소견이 제공됩니다.
                      </div>
                    )}

                    {opinion.status === "PENDING" && (
                      <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded text-sm text-gray-600">
                        수의사의 검토를 기다리고 있습니다.
                      </div>
                    )}
                  </WireframeBox>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 설정 탭 */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">설정</h2>

            <WireframeBox label="PROFILE SETTINGS">
              <h3 className="font-bold mb-4">프로필 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">이메일</label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full p-3 border-2 border-gray-300 bg-gray-100 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">전화번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full p-3 border-2 border-gray-300 font-mono text-sm"
                  />
                </div>
                <WireframeButton
                  variant="primary"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "정보 수정"}
                </WireframeButton>
              </div>
            </WireframeBox>

            <WireframeBox label="ACCOUNT MANAGEMENT" className="bg-red-50 border-red-300">
              <h3 className="font-bold mb-4 text-red-700">계정 관리</h3>
              <WireframeButton
                variant="outline"
                className="w-full text-red-600 border-red-400"
                onClick={handleLogout}
              >
                <LogOut className="inline w-4 h-4 mr-2" />
                로그아웃
              </WireframeButton>
            </WireframeBox>
          </div>
        )}
      </div>
    </div>
  );
}