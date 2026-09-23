import { Link } from 'react-router-dom';
import { Field, TextInput } from '../../shared/ui/ScreenParts';

export default function LoginPage() {
  return (
    <main className="auth-page"><div className="auth-art"><p className="eyebrow">READ TOGETHER, GO FURTHER</p><BookArt /><p>책으로 모이고,<br />이야기로 항해합니다.</p></div><section className="auth-panel"><p className="eyebrow">WELCOME BACK</p><h1>다시 만나 반가워요.</h1><p className="auth-panel__lead">로그인하고 이어서 항해해요.</p><form><Field label="이메일" required><TextInput type="email" autoComplete="email" placeholder="name@example.com" /></Field><Field label="비밀번호" required><TextInput type="password" autoComplete="current-password" placeholder="비밀번호를 입력해 주세요" /></Field><div className="auth-options"><label><input type="checkbox" /> 로그인 상태 유지</label><Link to="/login">비밀번호 찾기</Link></div><button className="button button--wide" type="button">로그인</button></form><p className="auth-switch">아직 계정이 없으신가요? <Link to="/signup">회원가입</Link></p></section></main>
  );
}

function BookArt() {
  return <div className="auth-book"><small>SHARE STORY</small><strong>함께 읽는<br />시간</strong><i /></div>;
}