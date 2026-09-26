import { Navigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import HomePage from '../../pages/home/HomePage';
import MeetupListPage from '../../pages/meetup/MeetupListPage';
import MeetupDetailPage from '../../pages/meetup/MeetupDetailPage';
import MeetupCreatePage from '../../pages/meetup/MeetupCreatePage';
import MeetupEditPage from '../../pages/meetup/MeetupEditPage';
import MyPage from '../../pages/journal/MyPage';
import LogbookReviewPage from '../../pages/logbook/LogbookReviewPage';
import SignupPage from '../../pages/auth/SignupPage';
import LoginPage from '../../pages/auth/LoginPage';
import ReviewCreatePage from '../../pages/review/ReviewCreatePage';
import ReviewListPage from '../../pages/review/ReviewListPage';
import ReviewEditPage from '../../pages/review/ReviewEditPage';
import CaptainVoyagesPage from '../../pages/journal/CaptainVoyagesPage';
import { EmptyState, ActionLink } from '../../shared/ui';

export const routes = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/meetups', element: <MeetupListPage /> },
      { path: '/meetups/create', element: <MeetupCreatePage /> },
      { path: '/meetups/:meetupId', element: <MeetupDetailPage /> },
      { path: '/meetups/:meetupId/edit', element: <MeetupEditPage /> },
      { path: '/meetups/:meetupId/reviews', element: <ReviewListPage /> },
      { path: '/meetups/:meetupId/reviews/create', element: <ReviewCreatePage /> },
      { path: '/meetups/:meetupId/reviews/:reviewId/edit', element: <ReviewEditPage /> },
      { path: '/meetups/:meetupId/logbooks/review', element: <LogbookReviewPage /> },
      { path: '/my-journal', element: <MyPage /> },
      { path: '/my-page', element: <Navigate to="/my-journal" replace /> },
      { path: '/my-journal/review', element: <Navigate to="/my-journal" replace /> },
      { path: '/captain/voyages', element: <CaptainVoyagesPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '*',
        element: (
          <EmptyState
            title="페이지를 찾을 수 없습니다."
            description="주소를 확인하거나 홈으로 돌아가 주세요."
            action={<ActionLink to="/">홈으로</ActionLink>}
          />
        ),
      },
    ],
  },
];
