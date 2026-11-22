import { useQuery } from '@tanstack/react-query';
import { readinessOptions } from '../api/health.api';

export function BackendStatus() {
  const { data, isPending, isError } = useQuery(readinessOptions());

  if (isPending) return <p className="text-muted-foreground">Checking backend…</p>;
  if (isError) {
    return (
      <p role="alert" className="text-danger">
        Backend is unavailable.
      </p>
    );
  }

  return <p className="text-muted-foreground">Backend status: {data.status}</p>;
}
