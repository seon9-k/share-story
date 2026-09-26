import type { MeetupForm } from '../../types/meetupForm';
import { Field, FormSection, TextInput, TextArea } from '../../../../shared/ui';
export default function MeetupInfoSection({
  form,
  onChange,
}: {
  form: MeetupForm;
  onChange: (field: keyof MeetupForm, value: string) => void;
}) {
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
