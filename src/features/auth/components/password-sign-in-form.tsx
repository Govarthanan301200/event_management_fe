import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signInErrorMessage, signInWithPassword } from '../api/supabase';

const passwordSchema = z.object({
  email: z.email('Enter the email your account uses'),
  password: z.string().min(1, 'Enter your password'),
});
type PasswordForm = z.infer<typeof passwordSchema>;

type PasswordSignInFormProps = { disabled: boolean };

/** On success the session listener redirects to Events; nothing else to do here. */
export function PasswordSignInForm({ disabled }: PasswordSignInFormProps) {
  const signIn = useMutation({
    mutationFn: (values: PasswordForm) => signInWithPassword(values.email, values.password),
  });
  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit((values) => {
          signIn.mutate(values);
        })(event)
      }
      className="flex flex-col gap-4"
    >
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="password-email">Email</FieldLabel>
        <Input
          id="password-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'password-email-error' : undefined}
          {...form.register('email')}
        />
        {errors.email ? (
          <FieldError id="password-email-error">{errors.email.message}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...form.register('password')}
        />
        {errors.password ? (
          <FieldError id="password-error">{errors.password.message}</FieldError>
        ) : null}
      </Field>
      {signIn.isError ? (
        <p role="alert" className="text-label text-danger">
          ⚠ {signInErrorMessage(signIn.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled || signIn.isPending} className="h-10">
        {signIn.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
