import { useState } from 'react';
import { useAuth } from '../../auth';
import {
  Button,
  Field,
  FormSection,
  PageContainer,
  PageHeading,
  TextInput,
  Notice,
} from '../../../shared/ui';
import RequestState from '../../../shared/ui/RequestState';
import { useProfile } from '../hooks/useProfile';
import styles from './ProfileView.module.css';
import ProfileEditForm from './ProfileEditForm';
import PasswordChangeForm from './PasswordChangeForm';
import WithdrawModal from './WithdrawModal';
export default function ProfileView() {
  const { user } = useAuth();
  // 인증 모듈은 수정하지 않고 이름·이메일은 /member/me 응답 사용
  const profile = useProfile();
  // 수정 버튼을 눌러야 수정 폼이 열림. 저장하면 다시 조회해 기본 정보에 반영
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  // 회원탈퇴 버튼을 누르면 비밀번호 확인 모달이 열림
  const [withdrawing, setWithdrawing] = useState(false);
  return (
    <PageContainer narrow>
      <PageHeading
        title="나의 회원정보"
        description="로그인한 계정의 정보를 확인하고 수정하세요."
      />
      <RequestState {...profile} retry={profile.reload} />
      <div className={styles.stack}>
        {!editing && (
          <>
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
          </>
        )}
        {saved && !editing && <Notice>회원정보를 수정했습니다.</Notice>}
        {!editing && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setWithdrawing(true)}>
              회원탈퇴
            </Button>
            {profile.data && (
              <Button
                onClick={() => {
                  setSaved(false);
                  setEditing(true);
                }}
              >
                회원정보 수정
              </Button>
            )}
          </div>
        )}
        {profile.data && editing && (
          <>
            <ProfileEditForm
              profile={profile.data}
              onSaved={() => {
                setEditing(false);
                setSaved(true);
                profile.reload();
              }}
              onCancel={() => setEditing(false)}
            />
            <PasswordChangeForm />
          </>
        )}
        {withdrawing && <WithdrawModal onClose={() => setWithdrawing(false)} />}
      </div>
    </PageContainer>
  );
}
