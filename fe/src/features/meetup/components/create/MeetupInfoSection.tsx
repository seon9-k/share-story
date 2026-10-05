import { useState } from 'react';
import type { MeetupForm } from '../../types/meetupForm';
import { uploadBookImage } from '../../api/meetupApi';
import { getCurrentUserId } from '../../lib/currentUser';
import { Field, FormSection, TextInput, TextArea, Notice } from '../../../../shared/ui';

export default function MeetupInfoSection({
  form,
  onChange,
}: {
  form: MeetupForm;
  onChange: (field: keyof MeetupForm, value: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');
      const { url } = await uploadBookImage(file, getCurrentUserId());
      onChange('bookImageUrl', url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FormSection number={1} title="도서 · 항해 정보">
      <Field label="함께 읽을 도서" required>
        <TextInput
          name="bookTitle"
          value={form.bookTitle}
          onChange={(e) => onChange('bookTitle', e.target.value)}
          required
        />
      </Field>
      <Field label="책 이미지 파일">
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
        {isUploading && <p>업로드 중...</p>}
        {uploadError && <Notice>{uploadError}</Notice>}
        {form.bookImageUrl && (
          <img src={form.bookImageUrl} alt="도서 이미지 미리보기" style={{ marginTop: '0.5rem', maxHeight: '120px' }} />
        )}
      </Field>
      <Field label="책 이미지 URL">
        <TextInput
          type="url"
          name="bookImageUrl"
          value={form.bookImageUrl}
          onChange={(e) => onChange('bookImageUrl', e.target.value)}
          placeholder="직접 업로드하거나 이미지 주소를 입력하세요."
        />
      </Field>
      <Field label="항해 제목" required>
        <TextInput
          name="meetupTitle"
          value={form.meetupTitle}
          onChange={(e) => onChange('meetupTitle', e.target.value)}
          required
        />
      </Field>
      <Field label="항해 소개" required>
        <TextArea
          name="intro"
          rows={3}
          value={form.intro}
          onChange={(e) => onChange('intro', e.target.value)}
          required
        />
      </Field>
    </FormSection>
  );
}
