import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../shared/layout/AppShell';
import GroupCreatePage from '../pages/GroupCreatePage/GroupCreatePage';
import GroupDetailPage from '../pages/GroupDetailPage/GroupDetailPage';
import GroupEditPage from '../pages/GroupEditPage/GroupEditPage';
import GroupListPage from '../pages/GroupListPage/GroupListPage';
import LoginPage from '../pages/LoginPage/LoginPage';
import SignupPage from '../pages/SignupPage/SignupPage';
import MyPage from '../pages/MyPage/MyPage';
import CaptainVoyagesPage from '../pages/CaptainVoyagesPage/CaptainVoyagesPage';
import ReviewListPage from '../pages/ReviewListPage/ReviewListPage';
import ReviewCreatePage from '../pages/ReviewCreatePage/ReviewCreatePage';
import ReviewEditPage from '../pages/ReviewEditPage/ReviewEditPage';
import '../shared/styles/service.css';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<GroupListPage />} />
        <Route path="voyages" element={<GroupListPage />} />
        <Route path="voyages/new" element={<GroupCreatePage />} />
        <Route path="voyages/:voyageId" element={<GroupDetailPage />} />
        <Route path="voyages/:voyageId/edit" element={<GroupEditPage />} />
        <Route path="my/voyages" element={<MyPage />} />
        <Route path="captain/voyages" element={<CaptainVoyagesPage />} />
        <Route path="voyages/:voyageId/reviews" element={<ReviewListPage />} />
        <Route path="voyages/:voyageId/reviews/new" element={<ReviewCreatePage />} />
        <Route path="reviews/:reviewId/edit" element={<ReviewEditPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;