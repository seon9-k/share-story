import { useId, useState, useEffect } from 'react';
import type { MemberSession } from '../../../member';
import { documentRequest } from '../../../../shared/api/client';
import { Button, Notice, TextArea } from '../../../../shared/ui';
import { logbookPath, type Logbook } from '../../types/api';
import styles from '../../../../shared/ui/Voyage.module.css';
import editorStyles from './LogbookEditor.module.css';

export default function LogbookEditor({
  meetupId,
  session,
  logbook,
  lockedMessage,
  onSaved,
  onDeleted,
}: {
  meetupId: string;
  session: MemberSession;
  logbook: Logbook | null;
  // 값이 있으면 작성·수정·삭제 불가 상태로 이 안내를 표시
  lockedMessage?: string;
  onSaved: (book: Logbook) => void;
  onDeleted: () => void;
}) {
  const [content, setContent] = useState(logbook?.content || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const dirty = content !== (logbook?.content || '');
  // 새로고침·탭 닫기 시 미제출 입력이 있음을 알림. SPA 내부 이동은 이 이벤트 대상 아님
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  // 본인 로그북 삭제. 성공한 경우에만 화면에서 제거
  const remove = async () => {
    if (!logbook || submitting) return;
    if (!window.confirm(`${session.session_number}회차 로그북을 삭제할까요?`)) return;
    setSubmitting(true);
    setError('');
    try {
      await documentRequest(`${logbookPath(meetupId, String(session.session_id))}/me`, {
        method: 'DELETE',
      });
      setContent('');
      onDeleted();
    } catch (error) {
      setError(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  const deleteButton = logbook && (
    <Button variant="secondary" onClick={remove} disabled={submitting}>
      로그북 삭제
    </Button>
  );
  if (lockedMessage)
    return (
      <div>
        <Notice>{lockedMessage}</Notice>
        <div className={styles.content}>{logbook?.content}</div>
      </div>
    );
  // 현재 BE는 취소된 세션만 제출을 막음. 회차별 작성 기간은 아직 미제공
  // 삭제는 취소된 세션에서도 허용
  if (session.status === 'CANCELLED')
    return (
      <div>
        <Notice>취소된 세션에는 로그북을 제출하거나 수정할 수 없습니다.</Notice>
        <div className={styles.content}>{logbook?.content}</div>
        {error && <Notice>{error}</Notice>}
        {deleteButton}
      </div>
    );
  return (
    <form
      className={editorStyles.logbookForm}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!content.trim() || submitting) return;
        setSubmitting(true);
        setError('');
        try {
          // 최초 제출과 수정은 동일한 PUT API 사용. 성공한 서버 응답만 화면에 반영
          const book = await documentRequest<Logbook>(
            `${logbookPath(meetupId, String(session.session_id))}/me`,
            { method: 'PUT', body: JSON.stringify({ content: content.trim() }) },
          );
          setContent(book.content || '');
          onSaved(book);
        } catch (error) {
          setError(error instanceof Error ? error.message : '제출에 실패했습니다.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label className={editorStyles.logbookTitle} htmlFor={id}>
        나의 독서 기록
      </label>
      <TextArea
        className={editorStyles.textarea}
        id={id}
        rows={10}
        value={content}
        required
        disabled={submitting}
        onChange={(event) => setContent(event.target.value)}
        placeholder="인상 깊었던 문장과 나누고 싶은 생각을 적어주세요."
      />
      <p className={styles.meta}>
        {content.length.toLocaleString()}자 · 제출 후에도 수정할 수 있습니다.
      </p>
      {error && <Notice>{error}</Notice>}
      <Button type="submit" disabled={submitting || !content.trim()}>
        {submitting ? '처리 중…' : logbook ? '수정하여 다시 제출' : '로그북 제출'}
      </Button>
      {deleteButton}
    </form>
  );
}
