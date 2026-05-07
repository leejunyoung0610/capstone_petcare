import { Link, useLocation } from "react-router";
import { CheckCircle, Bell, ChevronRight } from "lucide-react";

export function VetOpinionComplete() {
  const location = useLocation();
  const petName = location.state?.petName ?? "반려동물";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        
        {/* 완료 아이콘 */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">소견 발송 완료!</h1>
        <p className="text-slate-600 mb-6">
          <strong>{petName}</strong> 보호자에게 소견서가 전달되었습니다.
        </p>

        {/* 알림 전송 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">보호자 알림 전송됨</p>
            <p className="text-xs text-blue-700">
              보호자에게 소견 완료 알림이 자동으로 전송되었습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <Link
            to="/vet/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700"
          >
            대시보드로 돌아가기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}