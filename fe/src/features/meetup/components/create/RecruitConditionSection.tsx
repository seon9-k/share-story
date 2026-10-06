import type { MeetupForm } from '../../types/meetupForm';
import { Field, FormSection, TextInput } from '../../../../shared/ui';
export default function RecruitConditionSection({
  form,
  onChange,
}: {
  form: MeetupForm;
  onChange: (field: keyof MeetupForm, value: string) => void;
}) {
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  return (
    <FormSection title="Zoom · 모집 조건">
      <Field label="Zoom URL" required>
        <TextInput
          name="zoomUrl"
          required
          value={form.zoomUrl}
          onChange={(e) => onChange('zoomUrl', e.target.value)}
        />
      </Field>
      <Field label="Zoom 비밀번호" required>
        <TextInput
          name="zoomPassword"
          required
          value={form.zoomPassword}
          onChange={(e) => onChange('zoomPassword', e.target.value)}
        />
      </Field>
      <Field label="최소 인원" required>
        <TextInput
          type="number"
          name="minMembers"
          min={1}
          required
          value={form.minMembers}
          onChange={(e) => onChange('minMembers', e.target.value)}
        />
      </Field>
      <Field label="최대 인원" required>
        <TextInput
          type="number"
          name="maxMembers"
          min={1}
          required
          value={form.maxMembers}
          onChange={(e) => onChange('maxMembers', e.target.value)}
        />
      </Field>
      <Field label="모집 마감" required>
        <TextInput
          type="date"
          name="deadline"
          min={minDate}
          required
          value={form.deadline}
          onChange={(e) => onChange('deadline', e.target.value)}
        />
      </Field>
    </FormSection>
  );
}
