import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { submitReport } from '../api/reports';

export default function Report() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        target_type: '',
        target_label: '',
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.target_type) { alert('신고 대상을 선택해주세요.'); return; }
        if (!form.target_label.trim()) { alert('신고 대상 이름을 입력해주세요.'); return; }
        if (!form.reason.trim()) { alert('신고 사유를 입력해주세요.'); return; }
        setSubmitting(true);
        try {
            await submitReport(form);
            alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
            navigate(-1);
        } catch {
            alert('신고 접수에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {/* 상단 헤더 */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-slate-100">
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-base font-bold text-slate-900">신고하기</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

                {/* 신고 대상 유형 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                        신고 대상 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'vet', label: '수의사' },
                            { value: 'user', label: '사용자' },
                            { value: 'review', label: '리뷰' },
                            { value: 'other', label: '기타' },
                        ].map((item) => (
                            <button key={item.value} type="button"
                                onClick={() => setForm((p) => ({ ...p, target_type: item.value }))}
                                className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${form.target_type === item.value
                                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                    }`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 신고 대상 이름 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                        신고 대상 이름 <span className="text-red-500">*</span>
                    </label>
                    <input name="target_label" value={form.target_label} onChange={handleChange}
                        placeholder="예: 홍길동 수의사, ○○동물병원"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                {/* 신고 사유 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                        신고 사유 <span className="text-red-500">*</span>
                    </label>
                    <textarea name="reason" value={form.reason} onChange={handleChange}
                        placeholder="신고 사유를 자세히 입력해주세요." rows={5}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                </div>

                {/* 안내 문구 */}
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <span>⚠️</span>
                    <p>허위 신고는 제재를 받을 수 있습니다. 신고 내용은 관리자 검토 후 처리됩니다.</p>
                </div>

                {/* 제출 버튼 */}
                <button type="submit" onClick={handleSubmit} disabled={submitting}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? '접수 중...' : '신고 접수하기'}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/report/history')}
                    className="w-full mt-1 py-3 border border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                    내 신고 내역 보기
                </button>
            </div>
        </div>
    );
}