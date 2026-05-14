import { Link } from "react-router";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "2026년 5월 11일";
const VERSION = "v1.0";

const sections = [
  {
    id: "s1",
    title: "1. 개인정보 처리 목적",
    body: (
      <>
        회원 관리, 서비스 제공·품질 개선, 고객 문의 대응, 부정 이용 방지, 통계·분석(식별 불가 형태가 가능한 경우),
        관련 법령상 의무 이행 등을 위해 개인정보를 처리합니다.
      </>
    ),
  },
  {
    id: "s2",
    title: "2. 수집 항목 및 방법",
    body: (
      <>
        가입 시 이메일, 이름, 연락처 등 계정 정보를 수집할 수 있으며, 서비스 이용 과정에서 반려동물 정보, 업로드 이미지,
        AI 분석 결과, 접속 로그·기기 정보 등이 생성·저장될 수 있습니다. 수집 방법은 홈페이지·앱 가입, 고객센터 문의,
        자동 수집 도구 등에 따릅니다.
      </>
    ),
  },
  {
    id: "s3",
    title: "3. 보유 및 이용 기간",
    body: (
      <>
        관련 법령에서 정한 경우 해당 기간까지 보관하며, 그 외에는 수집 목적 달성 후 지체 없이 파기합니다. 내부 방침에
        따라 일정 기간 분리 보관할 수 있습니다.
      </>
    ),
  },
  {
    id: "s4",
    title: "4. 제3자 제공",
    body: (
      <>
        원칙적으로 이용자 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만 법령에 따른 요청이 있는 경우 예외로 할 수
        있습니다. AI 분석을 위해 설정된 분석 서버로 이미지·메타데이터가 전송될 수 있으며, 이 경우 제공 목적·범위는 서비스
        설정 및 위탁·연계 정책에 따릅니다.
      </>
    ),
  },
  {
    id: "s5",
    title: "5. 처리 위탁",
    body: (
      <>
        호스팅·결제·고객 지원 등 필요 시 개인정보 처리 업무의 일부를 외부에 위탁할 수 있으며, 위탁 시 계약 등을 통해
        관련 법령을 준수하도록 관리·감독합니다.
      </>
    ),
  },
  {
    id: "s6",
    title: "6. 이용자의 권리",
    body: (
      <>
        개인정보 열람·정정·삭제·처리 정지 및 동의 철회를 요청할 수 있으며, 회사는 지체 없이 조치합니다. 요청은
        고객센터·앱 내 설정 등 회사가 안내하는 경로로 하실 수 있습니다.
      </>
    ),
  },
  {
    id: "s7",
    title: "7. 안전성 확보 조치",
    body: (
      <>
        접근 권한 관리, 전송 구간 암호화(HTTPS 등), 저장 데이터 보호, 보안 점검 등 관련 법령 및 내규에 따른 조치를
        합니다.
      </>
    ),
  },
  {
    id: "s8",
    title: "8. 개인정보 보호책임자 및 문의",
    body: (
      <>
        개인정보 보호 관련 문의는 아래로 연락 주시기 바랍니다.
        <br />
        <span className="mt-2 block rounded-lg bg-slate-100 px-3 py-2 text-slate-800">
          이메일: support@peteyeai.com
          <br />
          (실제 운영 시 담당자 성명·연락처를 명시하세요.)
        </span>
      </>
    ),
  },
  {
    id: "s9",
    title: "9. 고지의 변경",
    body: (
      <>
        본 처리방침을 변경하는 경우 서비스 내 공지 등으로 안내합니다.
      </>
    ),
  },
];

export function LegalPrivacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Legal · Privacy</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">개인정보 처리방침</h1>
          <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">시행일</dt>
              <dd className="font-medium text-slate-800">{EFFECTIVE_DATE}</dd>
            </div>
            <div>
              <dt className="text-slate-400">문서 버전</dt>
              <dd className="font-medium text-slate-800">{VERSION}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">운영 주체</dt>
              <dd className="font-medium text-slate-800">PET EYE AI · 문의: support@peteyeai.com</dd>
            </div>
          </dl>
        </header>

        <p className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
          본 방침은 개인정보 보호법 등에 맞춘 출시용 형식을 갖추도록 작성되었습니다. 수집 항목·보유 기간·위탁 업체 목록은
          실제 운영 정책에 맞게 수정·공개하시기 바랍니다.
        </p>

        <nav
          aria-label="처리방침 목차"
          className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">목차</p>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-blue-600 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-700">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-base font-bold text-slate-900">{s.title}</h2>
              <div className="mt-2">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © PET EYE AI · 개인정보 처리방침 {VERSION}
        </p>
      </main>
    </div>
  );
}
