import { Link } from 'react-router';
import { Upload, Search, BarChart3, Shield, Sparkles, Scan, HeartPulse } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import { WireframeBox } from '../components/WireframeBox';
import { WireframeButton } from '../components/WireframeButton';
import { SectionHeader } from '../components/ui/SectionHeader';

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -left-8 -top-8 size-40 rounded-full bg-cyan-300/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -right-6 size-48 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-[3px] shadow-hero">
        <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-[1.85rem] bg-gradient-to-b from-white via-white to-blue-50/90 px-8 py-10 md:min-h-[380px]">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
            <Scan className="size-10" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-slate-800 md:text-xl">안구 이미지 분석</p>
            <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-slate-600">
              촬영한 눈 사진을 AI가 여러 질환 가능성을 참고용으로 정리합니다.
            </p>
          </div>
          <div className="flex w-full max-w-xs items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <HeartPulse className="size-4 text-rose-500" />
              스크리닝 진행률
            </span>
            <span className="font-mono font-semibold text-brand-link">준비 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 bg-dot-slate bg-[length:28px_28px]">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-slate-50/80 to-blue-50/50 pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl lg:max-w-none">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-sm">
                <Sparkles className="size-3.5 text-amber-500" />
                AI Screening
              </span>
              <h1 className="font-display text-display-sm text-balance text-slate-900 md:text-display lg:text-display-lg">
                반려동물 안구 건강,
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI로 빠르게 살펴보세요
                </span>
              </h1>
              <p className="prose prose-slate prose-lg mt-6 max-w-xl text-pretty text-slate-600 prose-p:leading-relaxed">
                스마트폰으로 찍은 <strong className="font-semibold text-slate-800">눈 사진 한 장</strong>
                으로 여러 안구 질환을 참고용으로 스크리닝합니다. 결과는 PDF로 정리해 병원 방문 시
                활용할 수 있습니다.
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-8">
                <li className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    ✓
                  </span>
                  회원가입 후 반려동물 등록
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    ✓
                  </span>
                  의료 진단이 아닌 스크리닝 안내
                </li>
              </ul>
              <div className="mt-10 flex flex-wrap gap-4">
                <WireframeButton variant="primary" asChild className="gap-2 px-8 py-3.5 text-base shadow-md shadow-blue-600/15">
                  <Link to="/register" className="inline-flex items-center">
                    <Upload className="size-5" />
                    무료로 시작하기
                  </Link>
                </WireframeButton>
                <span title="준비 중">
                  <WireframeButton
                    variant="outline"
                    className="cursor-not-allowed px-8 py-3.5 text-base opacity-55"
                    disabled
                  >
                    질환백과 보기
                  </WireframeButton>
                </span>
              </div>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['20만+', '학습 데이터', 'AI-Hub 등 공개·내부 데이터 기반'],
              ['다중 질환', '동시 스크리닝', '강아지·고양이 모델 분리 운용'],
              ['1,500만+', '반려 가구', '국내 반려동물 양육 인구 규모 참고'],
              ['0원', '스크리닝', '회원 기준 AI 사전 분석 이용'],
            ].map(([n, t, d]) => (
              <div
                key={t}
                className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-7 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-float"
              >
                <div className="font-display text-3xl font-bold tracking-tight text-brand-link md:text-4xl">
                  {n}
                </div>
                <div className="mt-2 font-semibold text-slate-900">{t}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Features"
            title="왜 PET EYE AI인가요?"
            subtitle="병원 가기 전, 집에서 한 번 더 눈 건강을 점검할 수 있도록 설계했습니다."
          />
          <div className="grid gap-8 md:grid-cols-3">
            <WireframeBox label="01 · Analysis">
              <div className="text-center md:text-left">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 md:mx-0">
                  <Sparkles className="size-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">멀티 라벨 AI 분석</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px] md:leading-7">
                  한 장의 이미지로 여러 안구 이상 가능성을 동시에 참고합니다. 최종 판단은 반드시
                  수의사에게 맡기세요.
                </p>
              </div>
            </WireframeBox>
            <WireframeBox label="02 · Report">
              <div className="text-center md:text-left">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 md:mx-0">
                  <Search className="size-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">리포트 · 병원 연계</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px] md:leading-7">
                  PDF 보고서로 소견을 정리해 두면 진료 시 설명이 수월합니다. 원격 수의사 소견은
                  순차 오픈 예정입니다.
                </p>
              </div>
            </WireframeBox>
            <WireframeBox label="03 · History">
              <div className="text-center md:text-left">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 md:mx-0">
                  <BarChart3 className="size-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">반려동물별 기록</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px] md:leading-7">
                  여러 마리를 등록하고, 진단 이력을 계정에 남겨 두었을 때 변화 추이를 가족이 함께
                  확인할 수 있습니다.
                </p>
              </div>
            </WireframeBox>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-slate-100/50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="How it works"
            title="이용 순서"
            subtitle="가입부터 결과 확인까지, 대략적인 흐름만 안내드립니다."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: '사진 촬영', desc: '밝은 곳에서 눈이 선명하게 나오도록 촬영합니다.' },
              { step: '2', title: '업로드 · 분석', desc: '반려동물을 고르고 이미지를 올리면 AI가 처리합니다.' },
              { step: '3', title: '결과 확인', desc: '질환별 가능성과 요약 문구를 화면에서 봅니다.' },
              { step: '4', title: 'PDF · 병원', desc: '보고서를 저장해 두었다가 동물병원에 방문하세요.' },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition hover:shadow-md"
              >
                <div className="absolute right-5 top-5 font-mono text-5xl font-bold text-slate-100">
                  {item.step}
                </div>
                <div className="relative mb-5 flex size-12 items-center justify-center rounded-xl bg-brand-link text-lg font-bold text-white shadow-md">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 py-14 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-sm">
              <Shield className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold text-slate-900">법적 고지</h3>
              <div className="prose prose-slate prose-sm mt-3 max-w-none text-slate-700">
                <p>
                  본 서비스는 <strong>의료기기가 아니며</strong>, AI 출력은{' '}
                  <strong>진단이 아닌 사전 스크리닝·참고 정보</strong>입니다. 치료 결정은 반드시
                  면허 수의사와 상담하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 text-white md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            우리 아이 눈 건강, 지금 점검해 보세요
          </h2>
          <p className="mt-5 text-lg text-blue-100/95">
            가입 후 반려동물만 등록하면 바로 스크리닝 플로우로 이동할 수 있습니다.
          </p>
          <div className="mt-10">
            <WireframeButton
              variant="outline"
              asChild
              className="border-white/90 bg-white px-10 py-4 text-base font-semibold text-blue-700 shadow-lg shadow-slate-900/20 hover:bg-blue-50"
            >
              <Link to="/register" className="inline-flex items-center gap-2">
                <Upload className="size-5" />
                무료로 시작하기
              </Link>
            </WireframeButton>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 py-14 text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-10 md:grid-cols-4 md:gap-8">
            <div className="md:col-span-1">
              <div className="font-display text-xl font-bold tracking-tight text-white">PET EYE AI</div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                반려동물 안구 건강을 위한 AI 사전 스크리닝 서비스. GANADI 프로젝트.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-300">
                서비스
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/register" className="transition hover:text-white">
                    AI 스크리닝
                  </Link>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-50">수의사 찾기</span>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-50">질환백과</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-300">
                지원
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <span className="cursor-not-allowed opacity-50">공지사항</span>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-50">FAQ</span>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-50">이용약관</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-300">
                문의
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>support@peteyeai.com</li>
                <li className="text-zinc-500">사업자등록번호: 000-00-00000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-xs text-zinc-500">
            © 2026 PET EYE AI · GANADI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
