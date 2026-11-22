import { BackendStatus } from '@/features/health';

export function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-headline">Event Management</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Backend connection status</p>
      <BackendStatus />
    </main>
  );
}
