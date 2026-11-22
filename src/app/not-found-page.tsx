import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 px-4 py-16">
      <h1 className="text-title-serif">This page doesn&apos;t exist</h1>
      <p className="text-body text-muted-foreground">
        Check the address, or go to{' '}
        <Link to="/events" className="text-gold underline underline-offset-4">
          your events
        </Link>
        .
      </p>
    </main>
  );
}
