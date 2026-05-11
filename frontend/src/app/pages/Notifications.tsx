import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getNotifications, markAsRead, markAllAsRead } from "../../api/notifications";
import { Header } from "../components/Header";
import { Bell, CheckCheck, FileText, AlertCircle } from "lucide-react";
import { format, addHours } from 'date-fns';

interface Notification {
  id: number;
  type: "opinion_answered" | "REMINDER" | "VET_APPROVED" | "SYSTEM";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon = (type: Notification["type"]) => {
  switch (type) {
    case "opinion_answered": return <FileText className="w-4 h-4 text-blue-500" />;
    case "REMINDER": return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case "VET_APPROVED": return <CheckCheck className="w-4 h-4 text-green-500" />;
    default: return <Bell className="w-4 h-4 text-slate-400" />;
  }
};

const typeLink = (type: Notification["type"]) => {
  switch (type) {
    case "opinion_answered": return "/mypage";
    case "REMINDER": return "/upload";
    default: return null;
  }
};

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setIsLoading(false));
  }, []);

  const handleRead = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }
    const link = typeLink(notification.type);
    if (link) navigate(link);
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-500">알림을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">알림</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-600">
                읽지 않은 알림 {unreadCount}개
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
            >
              <CheckCheck className="w-4 h-4" />
              전체 읽음
            </button>
          )}
        </div>

        {/* 알림 없음 */}
        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <Bell className="w-10 h-10 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRead(n)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  n.is_read
                    ? "bg-white border-slate-200 hover:bg-slate-50"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                }`}
              >
                {/* 아이콘 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.is_read ? "bg-slate-100" : "bg-white"
                }`}>
                  {typeIcon(n.type)}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-bold truncate ${
                      n.is_read ? "text-slate-500" : "text-slate-900"
                    }`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{n.message}</p>
                  <p className="text-xs text-slate-400">
                    {format(addHours(new Date(n.created_at), 9), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}