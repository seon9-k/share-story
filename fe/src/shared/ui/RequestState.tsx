import Button from './Button';
export default function RequestState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <p role="status" aria-live="polite">
        불러오는 중입니다…
      </p>
    );
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <Button variant="secondary" onClick={retry}>
          다시 시도
        </Button>
      </div>
    );
  return null;
}
