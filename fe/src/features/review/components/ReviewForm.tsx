import { useState } from 'react';
import { Field, TextArea, Button, ActionLink, Notice } from '../../../shared/ui';
import type { ReviewEntry } from '../types/reviewEntry';
import styles from './ReviewForm.module.css';
export default function ReviewForm({
  meetupId,
  review,
}: {
  meetupId: number;
  review?: ReviewEntry;
}) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [content, setContent] = useState(review?.content ?? '');
  const [message, setMessage] = useState('');
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(
          !rating || !content.trim()
            ? '별점과 후기를 입력해 주세요.'
            : '후기 저장은 아직 준비 중입니다. 작성 내용이 저장되지 않았습니다.',
        );
      }}
    >
      <fieldset className={styles.ratings}>
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
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={9}
          maxLength={1000}
        />
      </Field>
      <small className={styles.counter}>{content.length} / 1,000자</small>
      <div className={styles.actions}>
        <ActionLink to={`/meetups/${meetupId}/reviews`}>취소</ActionLink>
        <Button type="submit">{review ? '수정 내용 저장' : '후기 등록'}</Button>
      </div>
      {message && <Notice>{message}</Notice>}
    </form>
  );
}
