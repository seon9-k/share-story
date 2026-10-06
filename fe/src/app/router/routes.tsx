import { Navigate, type RouteObject } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import MyPageLayout from '../layout/MyPageLayout';
import RequireAuth from './RequireAuth';
import HomePage from '../../pages/home/HomePage';
import LoginPage from '../../pages/auth/LoginPage';
import SignupPage from '../../pages/auth/SignupPage';
import MeetupListPage from '../../pages/meetup/MeetupListPage';
import MeetupDetailPage from '../../pages/meetup/MeetupDetailPage';
import MeetupCreatePage from '../../pages/meetup/MeetupCreatePage';
import MeetupEditPage from '../../pages/meetup/MeetupEditPage';
import ReviewListPage from '../../pages/review/ReviewListPage';
import ReviewCreatePage from '../../pages/review/ReviewCreatePage';
import ReviewEditPage from '../../pages/review/ReviewEditPage';
import MyLogbooksPage from '../../pages/logbook/MyLogbooksPage';
import LogbookReviewPage from '../../pages/logbook/LogbookReviewPage';
import CaptainVoyagesPage from '../../pages/journal/CaptainVoyagesPage';
import JournalPage from '../../pages/mypage/JournalPage';
import ProfilePage from '../../pages/mypage/ProfilePage';
import { EmptyState, ActionLink } from '../../shared/ui';

// 이전 마이페이지 주소로 들어온 링크·북마크를 새 주소로 이동
const legacyMyPagePaths = ['/my-journal', '/my-journal/review', '/my-page'];

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      // 로그인 없이 볼 수 있는 화면
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/meetups', element: <MeetupListPage /> },
      ...legacyMyPagePaths.map((path) => ({
        path,
        element: <Navigate to="/mypage/journal" replace />,
      })),

      // 로그인이 필요한 화면
      {
        element: <RequireAuth />,
        children: [
          { path: '/meetups/create', element: <MeetupCreatePage /> },
          {
            path: '/meetups/:meetupId',
            children: [
              { index: true, element: <MeetupDetailPage /> },
              { path: 'edit', element: <MeetupEditPage /> },
              {
                path: 'reviews',
                children: [
                  { index: true, element: <ReviewListPage /> },
                  { path: 'create', element: <ReviewCreatePage /> },
                  { path: ':reviewId/edit', element: <ReviewEditPage /> },
                ],
              },
              {
                path: 'logbooks',
                children: [
                  { index: true, element: <MyLogbooksPage /> },
                  { path: 'review', element: <LogbookReviewPage /> },
                ],
              },
            ],
          },
          { path: '/captain/voyages', element: <CaptainVoyagesPage /> },
          {
            path: '/mypage',
            element: <MyPageLayout />,
            children: [
              { index: true, element: <Navigate to="journal" replace /> },
              { path: 'journal', element: <JournalPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },

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
