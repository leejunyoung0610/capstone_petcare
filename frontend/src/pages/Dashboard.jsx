import { Link } from 'react-router';
import { Upload, Sparkles } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { WireframeBox } from '../components/WireframeBox';
import { WireframeButton } from '../components/WireframeButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { SectionHeader } from '../components/ui/SectionHeader';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <WireframeBox label="대시보드" className="mb-12 shadow-float">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-link/90">
          Signed in
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          안녕하세요{user?.name ? `, ${user.name}님` : ''} 👋
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
          반려동물 프로필을 등록한 뒤 안구 사진을 업로드하면 AI 스크리닝 결과와 PDF 보고서를 받을 수
          있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WireframeButton variant="primary" asChild>
            <Link to="/pets">내 반려동물</Link>
          </WireframeButton>
          <WireframeButton variant="outline" asChild>
            <Link to="/pets/new">반려동물 등록</Link>
          </WireframeButton>
          <WireframeButton variant="secondary" asChild className="gap-2">
            <Link to="/diagnosis/new" className="inline-flex items-center">
              <Upload className="size-4" />
              AI 분석
            </Link>
          </WireframeButton>
        </div>
      </WireframeBox>

      <SectionHeader
        align="left"
        className="!mb-8 max-w-none"
        kicker="Quick start"
        title="다음 단계"
        subtitle="처음이시라면 순서대로 진행해 보세요."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-200/90 shadow-md shadow-slate-900/[0.04] transition hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-base">
              <span className="text-xl">📝</span> 1. 반려동물 등록
            </CardTitle>
            <CardDescription>이름, 종, 품종 등 기본 정보를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <WireframeButton variant="outline" asChild className="w-full">
              <Link to="/pets/new" className="inline-flex w-full justify-center">
                등록하기 →
              </Link>
            </WireframeButton>
          </CardContent>
        </Card>
        <Card className="border-slate-200/90 shadow-md shadow-slate-900/[0.04] transition hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-base">
              <span className="text-xl">📸</span> 2. 안구 사진
            </CardTitle>
            <CardDescription>밝은 곳에서 눈이 잘 보이게 촬영해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <WireframeButton variant="outline" asChild className="w-full">
              <Link to="/diagnosis/new" className="inline-flex w-full justify-center">
                분석하기 →
              </Link>
            </WireframeButton>
          </CardContent>
        </Card>
        <Card className="border-slate-200/90 shadow-md shadow-slate-900/[0.04] transition hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-base">
              <Sparkles className="size-5 text-brand-link" /> 3. 결과 · PDF
            </CardTitle>
            <CardDescription>결과 페이지에서 보고서를 내려받을 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <WireframeButton variant="outline" asChild className="w-full">
              <Link to="/pets" className="inline-flex w-full justify-center">
                반려동물 목록 →
              </Link>
            </WireframeButton>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
