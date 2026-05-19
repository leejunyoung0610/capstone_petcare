import { Link } from 'react-router';
import { Upload, Sparkles } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-10 md:py-14 lg:px-8">
      {/* 환영 카드 — 모바일에선 패딩/타이포 압축 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-10">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
          Signed in
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1">
          안녕하세요{user?.name ? `, ${user.name}님` : ''} 👋
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          눈 사진을 업로드하면 AI 스크리닝 결과와 PDF 보고서를 받을 수 있어요.
          <Link to="/" className="ml-1 font-medium text-blue-600 hover:underline">
            메인 페이지
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/pets" className="inline-flex">
            <button className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              내 반려동물
            </button>
          </Link>
          <Link to="/pets/new" className="inline-flex">
            <button className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              반려동물 등록
            </button>
          </Link>
          <Link to="/diagnosis/new" className="inline-flex">
            <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="w-4 h-4" />
              AI 분석
            </button>
          </Link>
        </div>
      </section>

      {/* 다음 단계 */}
      <div className="mb-3 sm:mb-6">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 mb-0.5">
          Quick start
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5">다음 단계</h2>
        <p className="text-xs sm:text-sm text-slate-500">처음이시라면 순서대로 진행해 보세요.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {[
          {
            icon: '📝',
            title: '1. 반려동물 등록',
            desc: '이름, 종, 품종 등 기본 정보를 입력합니다.',
            link: '/pets/new',
            label: '등록하기 →',
          },
          {
            icon: '📸',
            title: '2. 안구 사진',
            desc: '밝은 곳에서 눈이 잘 보이게 촬영해 주세요.',
            link: '/diagnosis/new',
            label: '분석하기 →',
          },
          {
            icon: null,
            title: '3. 결과 · PDF',
            desc: '진단 이력에서 결과를 확인하고 PDF 보고서를 내려받을 수 있어요.',
            link: '/diagnosis/history',
            label: '진단 이력 · PDF →',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon ? (
                <span className="text-lg">{item.icon}</span>
              ) : (
                <Sparkles className="w-5 h-5 text-blue-600" />
              )}
              <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3 leading-relaxed">{item.desc}</p>
            <Link to={item.link}>
              <button
                className={
                  item.title.startsWith('3.')
                    ? 'w-full py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700'
                    : 'w-full py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50'
                }
              >
                {item.label}
              </button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
