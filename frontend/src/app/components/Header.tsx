/**
 * 예전 랜딩 전용 헤더와 앱 헤더가 달라 보이던 문제를 없애기 위해
 * 전역 상단바는 모두 `AppHeader` 한 종류만 사용합니다.
 */
import AppHeader from "../../components/layout/AppHeader";

export function Header() {
  return <AppHeader />;
}

export default AppHeader;
