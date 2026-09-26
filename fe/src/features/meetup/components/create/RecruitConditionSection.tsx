import type { MeetupForm } from '../../types/meetupForm';
import { Field, FormSection, TextInput } from '../../../../shared/ui';
export default function RecruitConditionSection({
  form,
  onChange,
}: {
  form: MeetupForm;
  onChange: (field: keyof MeetupForm, value: string) => void;
}) {
  return (
    <FormSection number={2} title="장소 · 모집 조건">
      <Field label="장소" required>
        <TextInput
          name="location"
          required
          value={form.location}
          onChange={(e) => onChange('location', e.target.value)}
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
          required
          value={form.deadline}
          onChange={(e) => onChange('deadline', e.target.value)}
        />
      </Field>
    </FormSection>
  );
}
