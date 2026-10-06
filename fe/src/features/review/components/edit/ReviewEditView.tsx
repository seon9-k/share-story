import { Navigate, useParams } from 'react-router-dom';
export default function ReviewEditView() {
  const { meetupId } = useParams();
  return <Navigate to={`/meetups/${meetupId}/reviews`} replace />;
}
