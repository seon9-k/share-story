import { Link, NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="service-app">
      <header className="service-header">
        <Link className="service-logo" to="/" aria-label="Share Story 메인">
          <span className="service-logo__mark">S</span>
          <span>SHARE STORY<small>READ TOGETHER, GO FURTHER</small></span>
        </Link>
        <nav className="service-nav" aria-label="주요 메뉴">
          <NavLink to="/voyages">항해 찾기</NavLink>
          <NavLink to="/voyages/new">항해 개설</NavLink>
          <NavLink to="/my/voyages">나의 항해 일지</NavLink>
          <NavLink to="/captain/voyages">캡틴 메뉴</NavLink>
        </nav>
        <div className="service-header__account"><Link to="/login">로그인</Link><Link className="button button--small" to="/signup">회원가입</Link></div>
      </header>
      <Outlet />
      <footer className="service-footer"><span>SHARE STORY</span><span>책으로 모이고, 이야기로 항해합니다.</span></footer>
    </div>
  );
}