import { Link } from "react-router";
import { Menu, User, Bell } from "lucide-react";

export function Header() {
  return (
    <header className="border-b-2 border-gray-300 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-mono text-xl font-bold text-blue-600">
            [PET EYE AI]
          </Link>
          <nav className="hidden md:flex gap-6 font-mono text-sm">
            <Link to="/upload" className="hover:text-blue-600">AI 분석</Link>
            <Link to="/vets" className="hover:text-blue-600">수의사 찾기</Link>
            <Link to="/encyclopedia" className="hover:text-blue-600">질환백과</Link>
            <Link to="/mypage" className="hover:text-blue-600">마이페이지</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Bell className="w-5 h-5" />
          </button>
          <Link to="/login" className="p-2 hover:bg-gray-100 rounded">
            <User className="w-5 h-5" />
          </Link>
          <button className="md:hidden p-2 hover:bg-gray-100 rounded">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
