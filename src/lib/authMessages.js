export function authMessage(error) {
  const message = error?.message || '';
  const code = error?.code || '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return 'Incorrect email or password. Please try again.';
  if (['otp_expired', 'otp_disabled'].includes(code) || /token has expired or is invalid|invalid or expired (otp|code)|invalid (otp|verification code)|expired (otp|verification code)/i.test(message)) return 'Incorrect or expired code. Please request a new code and try again.';
  if (code === 'same_password' || /new password should be different/i.test(message)) return 'Choose a different password from your current password.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return 'Please verify your email before signing in.';
  if (code === 'user_banned' || /user is banned/i.test(message)) return 'Your account is suspended. Please contact support.';
  if (['over_request_rate_limit', 'over_email_send_rate_limit'].includes(code)) return 'Too many attempts. Please wait a moment and try again.';
  return message || 'Something went wrong. Please try again.';
}
