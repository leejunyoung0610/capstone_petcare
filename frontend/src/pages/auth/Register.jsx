import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Mail, Lock, User, Phone } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { WireframeBox } from '../../components/WireframeBox';
import { WireframeButton } from '../../components/WireframeButton';
import { InputCore } from '../../components/ui/input-core';

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

  const field = (name, label, type, placeholder, Icon, errKey) => (
    <div key={name}>
      <label className="mb-2 block font-mono text-sm font-bold text-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <InputCore
          name={name}
          type={type}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="border-2 py-3 pl-10 font-mono text-sm"
          required
        />
      </div>
      {errors[errKey || name] && (
        <p className="mt-1 font-mono text-xs text-destructive">{errors[errKey || name]}</p>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/80 to-indigo-100/90 p-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-blue-500/10 ring-1 ring-slate-200/80">
                <Eye className="size-8 text-brand-link" strokeWidth={1.75} />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-[15px] text-slate-600">보호자 회원가입</p>
        </div>

        <WireframeBox label="회원가입" className="shadow-float">
          {error && (
            <div className="mb-4 rounded border-2 border-destructive/40 bg-destructive/10 p-3 font-mono text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('email', '이메일', 'email', 'email@example.com', Mail)}
            {field('password', '비밀번호', 'password', '8자 이상', Lock)}
            {field('passwordConfirm', '비밀번호 확인', 'password', '비밀번호 재입력', Lock)}
            {field('name', '이름', 'text', '홍길동', User)}
            {field('phone', '전화번호', 'tel', '01012345678', Phone)}

            <WireframeButton
              variant="primary"
              type="submit"
              className="w-full py-3 text-base disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </WireframeButton>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link to="/login" className="font-bold text-brand-link hover:underline">
              로그인
            </Link>
          </div>
        </WireframeBox>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
