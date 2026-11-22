import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { sendSignInLink } from '../api/supabase';
import { useSession } from '../hooks/use-session';

const signInSchema = z.object({ email: z.email('Enter the email your account uses') });
type SignInForm = z.infer<typeof signInSchema>;

export function SignInPage() {
  const session = useSession();
  const send = useMutation({ mutationFn: (values: SignInForm) => sendSignInLink(values.email) });
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '' },
  });
  const emailError = form.formState.errors.email;

  if (session.status === 'signed-in') return <Navigate to="/events" replace />;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-title-serif">Sign in</h1>
      {session.status === 'unconfigured' ? (
        <p role="alert" className="text-body text-danger">
          ⚠ Sign-in isn&apos;t set up for this build. Add VITE_SUPABASE_URL and
          VITE_SUPABASE_PUBLISHABLE_KEY to .env.
        </p>
      ) : null}
      {send.isSuccess ? (
        <p className="text-body text-muted-foreground">
          Check your email for a sign-in link. You can close this tab once you&apos;ve opened it.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) => {
              send.mutate(values);
            })(event)
          }
          className="flex flex-col gap-4"
        >
          <Field data-invalid={emailError ? true : undefined}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              {...form.register('email')}
            />
            {emailError ? <FieldError id="email-error">{emailError.message}</FieldError> : null}
          </Field>
          {send.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ Couldn&apos;t send the link. Check the address, or ask for an account if you
              don&apos;t have one.
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={send.isPending || session.status === 'unconfigured'}
            className="h-10"
          >
            {send.isPending ? 'Sending…' : 'Email me a sign-in link'}
          </Button>
        </form>
      )}
    </main>
  );
}
