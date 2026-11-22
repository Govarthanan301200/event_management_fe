import { describe, expect, it } from 'vitest';
import { signInErrorMessage } from './supabase';

describe('signInErrorMessage', () => {
  it('explains the email rate limit instead of blaming the address', () => {
    expect(signInErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(
      /too many sign-in emails/i,
    );
  });

  it('says when no planner account exists', () => {
    expect(signInErrorMessage({ code: 'otp_disabled' })).toMatch(/no planner account/i);
  });

  it('falls back to a connection hint for anything else', () => {
    expect(signInErrorMessage(new TypeError('Failed to fetch'))).toMatch(/check your connection/i);
  });
});
