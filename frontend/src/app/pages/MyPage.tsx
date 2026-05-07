import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { authAPI } from "../../api/auth";
import { getMyPets } from "../../api/pets";
import { getMyOpinions } from "../../api/opinions";
import useAuthStore from "../../stores/authStore";
import { Header } from "../components/Header";
import { Modal } from "../components/Modal";
import { Camera } from "lucide-react";
import { getMyDiagnoses } from "../../api/diagnosis";
import {
  PawPrint, MessageCircle, Settings,
  Calendar, Eye, Plus, LogOut, Activity
} from "lucide-react";
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8002';

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
    vet: { name: o.vet_name ?? "", hospital_name: o.hospital_name ?? "" },
    pet: { name: o.pet_name ?? "" },
  };
}

interface UserProfile {
  email: string;
  nickname: string;
}

const statusStyle: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-gray-100 text-gray-600",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "완료",
  IN_PROGRESS: "진행중",
  CANCELLED: "취소",
  PENDING: "대기",
};

export function MyPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<"pets" | "opinions" | "settings" | "history">("pets");
  const [pets, setPets] = useState<Pet[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authAPI.getMe().then((res) => {
      if (cancelled) return;
      setProfile(res.data);
      setNickname(res.data.nickname);
      setPhone(res.data.phone || "");
      if (res.data.profile_image_url) {
        const imageUrl = res.data.profile_image_url.startsWith('http')
          ? res.data.profile_image_url
          : `${BASE_URL}/${res.data.profile_image_url}`;
        setProfileImagePreview(imageUrl);
      }
    }).catch(() => { });
    getMyPets().then((data) => { if (!cancelled) setPets(data); }).catch(() => { });
    getMyDiagnoses().then((data) => { if (!cancelled) setDiagnoses(data); }).catch(() => { });
    getMyOpinions().then((rows) => {
      if (!cancelled) setOpinions(Array.isArray(rows) ? rows.map(mapOpinionRow) : []);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleWithdraw = async () => {
    try {
      await authAPI.deleteMe();
      logout();
      navigate("/");
    } catch {
      alert("회원 탈퇴에 실패했습니다.");
    } finally {
      setShowWithdrawModal(false);
    }
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

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    try {
      setProfileImagePreview(URL.createObjectURL(file));
      const res = await authAPI.uploadProfileImage(file);
      if (res.data?.profile_image_url) {
        const imageUrl = res.data.profile_image_url.startsWith('http')
          ? res.data.profile_image_url
          : `${BASE_URL}/${res.data.profile_image_url}`;
        setProfileImagePreview(imageUrl);
      }
      alert('프로필 사진이 변경되었습니다.');
    } catch {
      alert('프로필 사진 변경에 실패했습니다.');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) return alert('현재 비밀번호를 입력해주세요.');
    if (!newPassword.trim()) return alert('새 비밀번호를 입력해주세요.');
    if (newPassword.length < 8) return alert('새 비밀번호는 8자 이상이어야 합니다.');
    try {
      setIsChangingPassword(true);
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      alert('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else {
        alert('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <Header />

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* 프로필 헤더 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div
                  className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl flex-shrink-0 cursor-pointer relative overflow-hidden"
                  onClick={() => profileImageRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <span>🐾</span>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    ref={profileImageRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">
                    {profile?.nickname || "로딩 중..."} 님
                  </h1>
                  <p className="text-sm text-slate-500 mb-2">{profile?.email}</p>
                  <div className="flex gap-4 text-sm text-slate-500">
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
              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4" />
                설정
              </button>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
            {[
              { key: "pets", label: "반려동물 관리", icon: PawPrint },
              { key: "history", label: "진단 이력", icon: Activity },
              { key: "opinions", label: "수의사 소견", icon: MessageCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 반려동물 관리 탭 */}
          {activeTab === "pets" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">내 반려동물</h2>
                <Link
                  to="/pets/new"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  반려동물 추가
                </Link>
              </div>

              {pets.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                  <PawPrint className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 mb-4">등록된 반려동물이 없습니다</p>
                  <Link to="/pets/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    반려동물 등록하기
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <div key={pet.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                      <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                        {pet.species === "dog" ? "🐕" : "🐱"}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{pet.name}</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {pet.species === "dog" ? "강아지" : "고양이"} · {pet.breed} · {pet.age}세
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/pets/${pet.id}/edit`} className="flex-1">
                          <button className="w-full py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                            수정
                          </button>
                        </Link>
                        <Link to="/upload" className="flex-1">
                          <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            검사하기
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 진단 이력 탭 */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">최근 진단 이력</h2>
                <Link to="/diagnosis/history" className="text-sm text-blue-600 hover:underline">
                  전체 보기 →
                </Link>
              </div>
              {diagnoses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                  <Activity className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 mb-4">진단 이력이 없습니다</p>
                  <Link to="/diagnosis/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    AI 진단 시작하기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnoses.slice(0, 5).map((item) => (
                    <Link key={item.id} to={`/diagnosis/${item.id}`}>
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.is_normal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.is_normal ? '정상' : item.main_disease}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {item.main_confidence && (
                          <p className="text-sm text-slate-500">신뢰도 {Math.round(item.main_confidence)}%</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 수의사 소견 탭 */}
          {activeTab === "opinions" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">수의사 소견 내역</h2>

              {opinions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                  <MessageCircle className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 mb-4">소견 내역이 없습니다</p>
                  <Link to="/vets" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    수의사 찾기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {opinions.map((opinion) => (
                    <div key={opinion.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{opinion.vet.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusStyle[opinion.status]}`}>
                              {statusLabel[opinion.status]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{opinion.vet.hospital_name}</p>
                          <p className="text-sm text-slate-500">반려동물: {opinion.pet.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {opinion.created_at.slice(0, 10)}
                          </p>
                        </div>
                      </div>

                      {opinion.status === "COMPLETED" && (
                        <Link to={`/opinions/${opinion.id}`}>
                          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                            <Eye className="w-4 h-4" />
                            소견 상세보기
                          </button>
                        </Link>
                      )}
                      {opinion.status === "IN_PROGRESS" && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                          수의사가 검토 중입니다. 평균 12~24시간 내 소견이 제공됩니다.
                        </div>
                      )}
                      {opinion.status === "PENDING" && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                          수의사의 검토를 기다리고 있습니다.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 설정 탭 */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">설정</h2>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">프로필 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">닉네임</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">전화번호</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : "정보 수정"}
                  </button>
                </div>
              </div>

              {/* 비밀번호 변경 */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">비밀번호 변경</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호 입력"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 입력 (8자 이상)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-red-600 mb-4">계정 관리</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="w-full py-2.5 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50"
                  >
                    회원 탈퇴
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showWithdrawModal}
        title="회원 탈퇴"
        message="정말 탈퇴하시겠어요? 반려동물 데이터를 포함한 모든 정보가 삭제되며 되돌릴 수 없습니다."
        confirmText="탈퇴하기"
        cancelText="취소"
        onConfirm={handleWithdraw}
        onCancel={() => setShowWithdrawModal(false)}
        isDanger={true}
      />
    </>
  );
}