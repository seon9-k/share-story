export { default as LoginView } from './components/login/LoginView';
export { default as SignupView } from './components/signup/SignupView';
export { AuthProvider } from './context/AuthProvider.tsx';
export { useAuth } from './hooks/useAuth';
export { AuthContext, type AuthContextValue } from './context/AuthContext';
export { api as authApi } from './lib/api/api';
export {
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  MAX_GENRES,
  READING_AMOUNT_OPTIONS,
  type Gender,
  type PreferredGenre,
  type ReadingAmount,
} from './types/signup';
