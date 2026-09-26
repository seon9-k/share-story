export type Gender = '남' | '여';

export type PreferredCategory =
  | 'NOVEL'
  | 'ECONOMY_BUSINESS'
  | 'SELF_DEVELOPMENT'
  | 'IT'
  | 'ESSAY'
  | 'TRAVEL_LIFESTYLE'
  | 'PARENT_CHILD'
  | 'HUMANITIES_PHILOSOPHY'
  | 'SOCIETY'
  | 'SCIENCE'
  | 'HISTORY'
  | 'ETC';

export type ReadingAmount = '1~2권' | '3~4권' | '4~5권' | '5~6권';

export interface SignupForm {
  id: string;
  password: string;
  passwordConfirm: string;

  emailId: string;
  emailDomain: string;

  nickname: string;

  gender: Gender | '';
  birthday: string;

  categories: PreferredCategory[];
  readingAmount: ReadingAmount | '';
}
