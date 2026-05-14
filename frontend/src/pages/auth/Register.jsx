import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Mail, Lock, User, Phone } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    clearError();
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = '유효한 이메일을 입력하세요.';
    if (formData.password.length < 8) newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    if (formData.password !== formData.passwordConfirm)
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!formData.name.trim()) newErrors.name = '이름을 입력하세요.';
    if (!formData.phone.match(/^010-?\d{4}-?\d{4}$/))
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
    if (!agreedTerms) newErrors.terms = '이용약관에 동의해 주세요.';
    if (!agreedPrivacy) newErrors.privacy = '개인정보 처리방침에 동의해 주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { passwordConfirm, ...data } = formData;
    const ok = await register(data);
    if (ok) {
      window.alert('회원가입이 완료되었습니다!');
      navigate('/login');
    }
  };

  const fields = [
    { name: 'email', label: '이메일', type: 'email', placeholder: 'email@example.com', Icon: Mail },
    { name: 'password', label: '비밀번호', type: 'password', placeholder: '8자 이상', Icon: Lock },
    { name: 'passwordConfirm', label: '비밀번호 확인', type: 'password', placeholder: '비밀번호 재입력', Icon: Lock },
    { name: 'name', label: '이름', type: 'text', placeholder: '홍길동', Icon: User },
    { name: 'phone', label: '전화번호', type: 'tel', placeholder: '01012345678', Icon: Phone },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/80 to-indigo-100/90 p-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* 로고 */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80">
                <Eye className="size-8 text-blue-600" strokeWidth={1.75} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-sm text-slate-500">보호자 회원가입</p>
        </div>

        {/* 회원가입 카드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type, placeholder, Icon }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                {errors[name] && (
                  <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => {
                    setAgreedTerms(e.target.checked);
                    setErrors((p) => ({ ...p, terms: '' }));
                  }}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    이용약관
                  </Link>
                  에 동의합니다 (필수)
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}
              <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => {
                    setAgreedPrivacy(e.target.checked);
                    setErrors((p) => ({ ...p, privacy: '' }));
                  }}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    개인정보 처리방침
                  </Link>
                  에 동의합니다 (필수)
                </span>
              </label>
              {errors.privacy && <p className="text-xs text-red-500">{errors.privacy}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">이미 계정이 있으신가요? </span>
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              로그인
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <Link to="/" className="block text-sm text-slate-400 hover:text-slate-900">
            ← 메인으로 돌아가기
          </Link>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <Link to="/legal/privacy" className="hover:text-slate-700 underline-offset-2 hover:underline">
              개인정보 처리방침
            </Link>
            <Link to="/legal/terms" className="hover:text-slate-700 underline-offset-2 hover:underline">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}