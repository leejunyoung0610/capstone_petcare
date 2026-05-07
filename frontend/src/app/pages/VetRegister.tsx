import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Eye,
  Mail,
  Lock,
  User,
  Building2,
  Stethoscope,
  ArrowLeft,
  FileText,
  Upload,
  X,
  BadgeCheck,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";

/**
 * 수의사 회원 신청 — 면허증 사본을 함께 업로드한다.
 *
 * 가입 흐름:
 *   1) 이메일/비밀번호/이름/병원명/면허번호 + 면허증 사본(필수) 입력
 *   2) 재직증명서(선택) 첨부
 *   3) 백엔드는 approval_status="pending" 으로 저장 → 관리자 검토 대기
 *   4) 관리자가 승인하면 로그인하여 수의사 포털 사용 가능
 */

const ACCEPT_DOC = ".jpg,.jpeg,.png,.webp,.pdf";
const MAX_DOC_MB = 10;

type FieldKey =
  | "email"
  | "password"
  | "passwordConfirm"
  | "name"
  | "hospital_name"
  | "license_number";

export function VetRegister() {
  const navigate = useNavigate();
  const { vetRegisterWithDocs, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState<Record<FieldKey, string>>({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    hospital_name: "",
    license_number: "",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [employmentFile, setEmploymentFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const employmentInputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name as FieldKey]: value }));
    setLocalError(null);
    clearError();
  };

  const validateFile = (file: File | null, label: string): string | null => {
    if (!file) return null;
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      return `${label} 크기는 ${MAX_DOC_MB}MB 이하여야 합니다.`;
    }
    return null;
  };

  const onPickLicense = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    const err = validateFile(f, "면허증");
    if (err) {
      setLocalError(err);
      return;
    }
    setLicenseFile(f);
    setLocalError(null);
  };

  const onPickEmployment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    const err = validateFile(f, "재직증명서");
    if (err) {
      setLocalError(err);
      return;
    }
    setEmploymentFile(f);
    setLocalError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setLocalError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setLocalError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!form.name.trim()) {
      setLocalError("이름을 입력해주세요.");
      return;
    }
    if (!form.hospital_name.trim()) {
      setLocalError("병원명을 입력해주세요.");
      return;
    }
    if (!form.license_number.trim()) {
      setLocalError("수의사 면허번호를 입력해주세요.");
      return;
    }
    if (!licenseFile) {
      setLocalError("면허증 사본을 첨부해주세요. (필수)");
      return;
    }

    const ok = await vetRegisterWithDocs({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      hospital_name: form.hospital_name.trim(),
      license_number: form.license_number.trim(),
      license_image: licenseFile,
      employment_doc: employmentFile ?? undefined,
    });

    if (ok) {
      window.alert(
        [
          "신청이 접수되었습니다.",
          "관리자가 면허증을 검토한 뒤 승인 메일을 보내드립니다.",
          "(평일 기준 1~2영업일 소요)",
        ].join("\n")
      );
      navigate("/login", { replace: true });
    }
  };

  const err = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          로그인으로
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/50">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-600/30">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">수의사 포털 · 회원 신청</h1>
            <p className="mt-2 text-sm text-slate-500">
              가입 후{" "}
              <strong className="text-slate-700">관리자가 면허증을 검토</strong>하여
              승인이 완료되어야 본 서비스를 이용할 수 있습니다.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="name@hospital.com"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                비밀번호 (8자 이상)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.passwordConfirm}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 이름 */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                이름 (표시명)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="홍길동"
                />
              </div>
            </div>

            {/* 병원명 */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                병원명
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="hospital_name"
                  type="text"
                  required
                  value={form.hospital_name}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="○○동물병원"
                />
              </div>
            </div>

            {/* 면허번호 */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                수의사 면허번호
              </label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="license_number"
                  type="text"
                  required
                  value={form.license_number}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="예: 12345"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                농림축산식품부에서 발급받은 면허번호를 입력해주세요.
              </p>
            </div>

            {/* 면허증 사본 (필수) */}
            <FileField
              label="면허증 사본"
              required
              accept={ACCEPT_DOC}
              file={licenseFile}
              inputRef={licenseInputRef}
              onPick={onPickLicense}
              onClear={() => setLicenseFile(null)}
              hint="이미지(jpg/png/webp) 또는 PDF, 최대 10MB"
            />

            {/* 재직/개업 증명서 (선택) */}
            <FileField
              label="재직증명서 / 개업신고증"
              required={false}
              accept={ACCEPT_DOC}
              file={employmentFile}
              inputRef={employmentInputRef}
              onPick={onPickEmployment}
              onClear={() => setEmploymentFile(null)}
              hint="선택사항 — 첨부 시 승인이 빨라질 수 있어요"
            />

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "처리 중…" : "신청하기"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              수의사 로그인
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <Eye className="h-4 w-4" />
            서비스 홈
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------- 파일 첨부 필드 (재사용) ----------
function FileField(props: {
  label: string;
  required: boolean;
  accept: string;
  hint?: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const { label, required, accept, hint, file, inputRef, onPick, onClear } = props;
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="text-red-500">*</span>
        ) : (
          <span className="text-slate-400">(선택)</span>
        )}
      </label>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-5 text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          <Upload className="h-4 w-4" />
          파일 선택
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-[11px] text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            aria-label="파일 제거"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onPick}
        className="hidden"
      />

      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
