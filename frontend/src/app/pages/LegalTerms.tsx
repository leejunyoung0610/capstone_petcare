import { Link } from "react-router";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "2026년 5월 11일";
const VERSION = "v1.0";

const articles = [
  {
    id: "art1",
    title: "제1조 (목적)",
    body: (
      <>
        본 약관은 PET EYE AI(이하 &quot;회사&quot;)가 제공하는 반려동물 안구 관련 온라인 서비스(이하
        &quot;서비스&quot;)의 이용 조건·절차 및 회사와 이용자의 권리·의무를 규정함을 목적으로 합니다.
      </>
    ),
  },
  {
    id: "art2",
    title: "제2조 (정의)",
    body: (
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>&quot;서비스&quot;: 회사가 운영하는 웹·애플리케이션 등을 통해 제공하는 AI 보조 스크리닝·정보 제공 기능 일체</li>
        <li>&quot;회원&quot;: 약관에 동의하고 가입 절차를 마친 이용자</li>
        <li>&quot;콘텐츠&quot;: 회원이 업로드한 이미지·텍스트 등 서비스 내 게재 정보</li>
      </ul>
    ),
  },
  {
    id: "art3",
    title: "제3조 (약관의 효력 및 변경)",
    body: (
      <>
        본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다. 회사는 관련 법령을 위반하지 않는
        범위에서 약관을 개정할 수 있으며, 개정 시 사전 공지합니다. 회원이 개정 후에도 서비스를 계속 이용하는 경우 개정
        약관에 동의한 것으로 볼 수 있습니다.
      </>
    ),
  },
  {
    id: "art4",
    title: "제4조 (서비스의 성격)",
    body: (
      <>
        서비스는 동물의 진단·치료 행위를 대행하지 않으며, 수의사법 등 관련 법령에 따른 의료행위가 아닌 참고용 정보·사전
        스크리닝 보조 목적으로 제공됩니다. 최종 판단·처방·치료는 반드시 면허 수의사 및 동물병원을 통해 이루어져야
        합니다.
      </>
    ),
  },
  {
    id: "art5",
    title: "제5조 (회원가입 및 계정)",
    body: (
      <>
        회원은 회사가 정한 양식에 따라 정보를 제공하고 약관에 동의함으로써 가입을 신청합니다. 회사는 신청자에게 서비스
        이용을 승낙할 수 있으며, 허위 정보·부정 이용 우려 등이 있는 경우 승낙을 거절하거나 사후에 이용을 제한할 수
        있습니다. 계정 정보 관리 책임은 회원에게 있습니다.
      </>
    ),
  },
  {
    id: "art6",
    title: "제6조 (이용자의 의무)",
    body: (
      <>
        회원은 타인의 권리를 침해하는 콘텐츠를 업로드하거나, 불법·음란·명예훼손에 해당하는 행위, 시스템 부정 접근·과부하
        유발, 영업 방해 등을 해서는 안 됩니다.
      </>
    ),
  },
  {
    id: "art7",
    title: "제7조 (서비스 제공·변경·중단)",
    body: (
      <>
        회사는 운영·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 사전 또는 사후에 공지합니다.
        불가피한 장애·점검 등으로 일시 중단될 수 있습니다.
      </>
    ),
  },
  {
    id: "art8",
    title: "제8조 (AI 결과 및 면책)",
    body: (
      <>
        AI 분석 결과는 알고리즘·학습 데이터의 한계로 오류·누락이 있을 수 있으며 의료기기 또는 진단행위를 대체하지
        않습니다. 회사는 관련 법령이 허용하는 범위에서 서비스 이용과 관련한 간접·특별·결과적 손해 등에 대해 책임을 제한할
        수 있습니다.
      </>
    ),
  },
  {
    id: "art9",
    title: "제9조 (저작권 등)",
    body: (
      <>
        서비스 UI·텍스트·로고 등 회사 저작물에 대한 권리는 회사에 귀속됩니다. 회원이 업로드한 콘텐츠의 저작권은 회원에게
        있으나, 서비스 운영·품질 개선에 필요한 범위에서 회사가 이용할 수 있습니다(별도 동의 또는 설정이 있는 경우 그에
        따름).
      </>
    ),
  },
  {
    id: "art10",
    title: "제10조 (준거법 및 재판관할)",
    body: (
      <>
        본 약관은 대한민국 법령에 따릅니다. 회사와 회원 간 분쟁에 관하여는 관할 법원을 회사 본점 소재지를 관할하는 법원으로
        합니다(소비자 관련 분쟁은 관련 법령에 따른 관할이 우선할 수 있습니다).
      </>
    ),
  },
];

export function LegalTerms() {
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
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Legal · Terms</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">이용약관</h1>
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
          본 약관은 출시·심사용 표준 형식을 갖추도록 작성되었습니다. 실제 사업자 정보·분쟁 관할·세부 조항은 법무 검토 후
          확정하시기 바랍니다.
        </p>

        <nav
          aria-label="약관 목차"
          className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">목차</p>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {articles.map((a, i) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="text-blue-600 hover:underline">
                  {i + 1}. {a.title.replace(/^제\d+조\s*/, "")}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-700">
          {articles.map((a) => (
            <section key={a.id} id={a.id} className="scroll-mt-24">
              <h2 className="text-base font-bold text-slate-900">{a.title}</h2>
              <div className="mt-2">{a.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © PET EYE AI · 이용약관 {VERSION}
        </p>
      </main>
    </div>
  );
}
