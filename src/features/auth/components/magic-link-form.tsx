import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { sendSignInLink, signInErrorMessage } from '../api/supabase';

const linkSchema = z.object({ email: z.email('Enter the email your account uses') });
type LinkForm = z.infer<typeof linkSchema>;

type MagicLinkFormProps = { disabled: boolean };

export function MagicLinkForm({ disabled }: MagicLinkFormProps) {
  const send = useMutation({ mutationFn: (values: LinkForm) => sendSignInLink(values.email) });
  const form = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: { email: '' },
  });
  const emailError = form.formState.errors.email;

  if (send.isSuccess) {
    return (
      <p className="text-body text-muted-foreground">
        Check your email for a sign-in link. You can close this tab once you&apos;ve opened it.
      </p>
    );
  }

  return (
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
        <FieldLabel htmlFor="link-email">Email</FieldLabel>
        <Input
          id="link-email"
          type="email"
          autoComplete="email"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'link-email-error' : undefined}
          {...form.register('email')}
        />
        {emailError ? <FieldError id="link-email-error">{emailError.message}</FieldError> : null}
      </Field>
      {send.isError ? (
        <p role="alert" className="text-label text-danger">
          ⚠ {signInErrorMessage(send.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled || send.isPending} className="h-10">
        {send.isPending ? 'Sending…' : 'Email me a sign-in link'}
      </Button>
    </form>
  );
}
