export interface MeetupForm {
  bookTitle: string;
  meetupTitle: string;
  intro: string;
  location: string;
  minMembers: string;
  maxMembers: string;
  deadline: string;
  price: string;
  payment: string;
}

export interface MeetupSession {
  number: number;
  date: string;
  time: string;
  topic: string;
}

export interface CreateMeetupRequest {
  bookTitle: string;
  meetupTitle: string;
  intro: string;
  location: string;
  minMembers: number;
  maxMembers: number;
  deadline: string;
  price: number;
  payment: string;
  sessions: MeetupSession[];
}
