export interface MeetupForm {
  bookTitle: string;
  bookImageUrl: string;
  meetupTitle: string;
  intro: string;
  zoomUrl: string;
  zoomPassword: string;
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
  endTime: string;
  topic: string;
}

export interface CreateMeetupPayload {
  leader_id: string;
  user_id: string;
  title: string;
  description: string;
  book_title: string;
  book_image_url: string | null;
  price: number;
  min_capacity: number;
  max_capacity: number;
  deadline: string;
  sessions: Array<{
    session_number: number;
    topic: string;
    sch_date: string;
    sch_day: string;
    sch_time: string;
    sch_st_time: string;
    sch_ed_time: string;
    zoom_url: string | null;
    zoom_password: string | null;
  }>;
}
