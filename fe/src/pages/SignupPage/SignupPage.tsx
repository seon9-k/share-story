import { Link } from 'react-router-dom';
import { Field, TextInput } from '../../shared/ui/ScreenParts';

export default function SignupPage() {
  return (
    <main className="auth-page auth-page--signup"><div className="auth-art"><p className="eyebrow">YOUR NEXT STORY STARTS HERE</p><div className="signup-quote">“함께 읽으면<br />이야기는 더 멀리 갑니다.”</div><p>Share Story에서 다음 크루를 만나보세요.</p></div><section className="auth-panel"><p className="eyebrow">CREATE ACCOUNT</p><h1>함께 읽을 준비가 되셨나요?</h1><p className="auth-panel__lead">계정을 만들고 새로운 항해를 시작하세요.</p><form><Field label="이름" required><TextInput autoComplete="name" placeholder="이름을 입력해 주세요" /></Field><Field label="이메일" required><TextInput type="email" autoComplete="email" placeholder="name@example.com" /></Field><Field label="비밀번호" required hint="8자 이상, 영문과 숫자를 포함해 주세요."><TextInput type="password" autoComplete="new-password" placeholder="비밀번호를 입력해 주세요" /></Field><Field label="비밀번호 확인" required><TextInput type="password" autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요" /></Field><label className="agreement"><input type="checkbox" /> <span>이용약관과 개인정보 처리방침에 동의합니다. <b>(필수)</b></span></label><button className="button button--wide" type="button">회원가입</button></form><p className="auth-switch">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p></section></main>
  );
}