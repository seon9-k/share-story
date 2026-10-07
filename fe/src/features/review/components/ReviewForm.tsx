import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentRequest } from '../../../shared/api/client';
import { Field, TextArea, Button, ActionLink, Notice } from '../../../shared/ui';
import { reviewPath, ownReviewPath } from '../api/types';
import styles from './ReviewForm.module.css';
// initial이 있으면 본인 후기 수정(PATCH), 없으면 새 후기 등록(POST)
export default function ReviewForm({
  meetupId,
  initial,
}: {
  meetupId: string;
  initial?: { rating: number; content: string };
}) {
  const editing = !!initial;
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [content, setContent] = useState(initial?.content ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting) return;
        if (!rating || !content.trim()) {
          setMessage('별점과 후기를 입력해 주세요.');
          return;
        }
        setSubmitting(true);
        setMessage('');
        try {
          await documentRequest(editing ? ownReviewPath(meetupId) : reviewPath(meetupId), {
            method: editing ? 'PATCH' : 'POST',
            body: JSON.stringify({ rating, content: content.trim() }),
          });
          navigate(`/meetups/${meetupId}/reviews`, {
            replace: true,
            state: { message: editing ? '항해 후기를 수정했습니다.' : '항해 후기를 등록했습니다.' },
          });
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : editing
                ? '후기 수정에 실패했습니다.'
                : '후기 등록에 실패했습니다.',
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <fieldset className={styles.ratings} disabled={submitting}>
        <legend>별점 (필수)</legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <label className={styles.rating} key={value}>
            <input
              type="radio"
              name="rating"
              value={value}
              checked={rating === value}
              onChange={() => setRating(value)}
              required
            />
            {value}점
          </label>
        ))}
      </fieldset>
      <Field label="항해 후기" required hint="함께 읽으며 좋았던 경험을 들려주세요.">
        <TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={9}
          disabled={submitting}
        />
      </Field>
      <div className={styles.actions}>
        <ActionLink to={`/meetups/${meetupId}/reviews`}>후기 목록</ActionLink>
        <Button type="submit" disabled={submitting}>
          {submitting ? (editing ? '수정 중…' : '등록 중…') : editing ? '후기 수정' : '후기 등록'}
        </Button>
      </div>
      {message && <Notice>{message}</Notice>}
    </form>
  );
}
