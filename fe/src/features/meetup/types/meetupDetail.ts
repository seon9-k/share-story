export interface MeetupDetailSession {
  number: number;
  date: string;
  topic: string;
}

export interface MeetupStatItem {
  label: string;
  count: number;
}

export interface MeetupStats {
  age: MeetupStatItem[];
  gender: MeetupStatItem[];
  reading: MeetupStatItem[];
}

export interface RelatedMeetup {
  title: string;
  book: string;
  image: string;
}

export interface MeetupDetail {
  id: number;
  title: string;
  book: string;
  captain: string;
  intro: string;

  location: string;
  time: string;

  appliedMembers: number | null;
  maxMembers: number;

  deadline: string;

  price: number | null;
  payment: string;

  status: string;
  image: string;

  sessions: MeetupDetailSession[];
  stats: MeetupStats;
  relatedMeetups: RelatedMeetup[];
}
