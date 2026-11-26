import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { signOut } from '@/features/auth';
import { forgetThisDevice } from '@/features/day-of';

/** Sign out: first this device stops getting reminders and drops its offline cache (DPDP). */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return () => {
    void forgetThisDevice()
      .then(() => signOut())
      .then(() => {
        queryClient.clear();
        void navigate('/sign-in');
      });
  };
}
