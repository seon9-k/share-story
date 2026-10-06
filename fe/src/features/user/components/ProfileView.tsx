import { useAuth } from '../../auth';
import {
  Field,
  FormSection,
  PageContainer,
  PageHeading,
  TextInput,
  Notice,
} from '../../../shared/ui';
import RequestState from '../../../shared/ui/RequestState';
import { useProfile } from '../hooks/useProfile';
export default function ProfileView() {
  const { user } = useAuth();
  // 인증 모듈은 수정하지 않고 이름·이메일은 /member/me 응답 사용
  const profile = useProfile();
  return (
    <PageContainer narrow>
      <PageHeading title="나의 회원정보" description="로그인한 계정의 정보를 확인하세요." />
      <RequestState {...profile} retry={profile.reload} />
      <FormSection title="기본 정보">
        <Field label="아이디">
          <TextInput value={profile.data?.user_id || user?.user_id || ''} readOnly />
        </Field>
        <Field label="이름">
          <TextInput
            value={profile.data?.name || ''}
            placeholder="제공된 정보가 없습니다."
            readOnly
          />
        </Field>
        <Field label="이메일">
          <TextInput
            value={profile.data?.email || ''}
            placeholder="제공된 정보가 없습니다."
            readOnly
          />
        </Field>
      </FormSection>
      <Notice>회원정보 수정은 아직 지원하지 않습니다.</Notice>
    </PageContainer>
  );
}
