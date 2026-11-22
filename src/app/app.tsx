import { MessageList } from '@/features/messages';

export function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-headline">Event Management</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Data fetched from Supabase via the backend API
      </p>
      <MessageList />
    </main>
  );
}
