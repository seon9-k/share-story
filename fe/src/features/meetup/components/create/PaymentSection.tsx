import type { MeetupForm } from '../../types/meetupForm';
import { Field, FormSection, TextInput, Select } from '../../../../shared/ui';
export default function PaymentSection({
  form,
  onChange,
}: {
  form: MeetupForm;
  onChange: (field: keyof MeetupForm, value: string) => void;
}) {
  return (
    <FormSection number={4} title="참여 금액 · 납부 방법">
      <Field label="참여 금액 (원)" required>
        <TextInput
          name="price"
          type="number"
          min={0}
          required
          value={form.price}
          onChange={(e) => onChange('price', e.target.value)}
        />
      </Field>
      <Field label="납부 방법">
        <Select value={form.payment} onChange={(e) => onChange('payment', e.target.value)}>
          <option>일시납</option>
          <option>분할납</option>
        </Select>
      </Field>
    </FormSection>
  );
}
