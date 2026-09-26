import type { CreateMeetupRequest, MeetupForm, MeetupSession } from '../types/meetupForm';

export function toCreateMeetupRequest(
  form: MeetupForm,
  sessions: MeetupSession[],
): CreateMeetupRequest {
  return {
    bookTitle: form.bookTitle,
    meetupTitle: form.meetupTitle,
    intro: form.intro,
    location: form.location,
    minMembers: Number(form.minMembers),
    maxMembers: Number(form.maxMembers),
    deadline: form.deadline,
    price: Number(form.price),
    payment: form.payment,
    sessions,
  };
}
