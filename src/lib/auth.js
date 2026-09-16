import { supabase } from './supabase';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const EMAIL_OTP_LENGTH = 8;

function getAuthErrorDetails(error) {
  const response = error?.response;
  return {
    message: error?.message || 'Unknown authentication error',
    status: error?.status ?? response?.status ?? null,
    code: error?.code ?? null,
    name: error?.name ?? null,
    responseStatus: response?.status ?? null,
    responseStatusText: response?.statusText ?? null,
  };
}

function logAuthError(operation, error) {
  if (import.meta.env.DEV) {
    console.error(`[PAWLOC auth] ${operation} failed`, getAuthErrorDetails(error));
  }
}

function throwAuthError(operation, error) {
  if (!error) return;
  logAuthError(operation, error);
  throw error;
}

export function getAuthErrorMessage(error, fallback) {
  const details = getAuthErrorDetails(error);

  if (!import.meta.env.DEV) return fallback;

  const metadata = [
    details.status !== null ? `status: ${details.status}` : null,
    details.code ? `code: ${details.code}` : null,
    details.name ? `name: ${details.name}` : null,
    details.responseStatus !== null ? `response status: ${details.responseStatus}` : null,
    details.responseStatusText ? `response: ${details.responseStatusText}` : null,
  ].filter(Boolean);

  return metadata.length ? `${details.message} (${metadata.join('; ')})` : details.message;
}

function requireEmailOtp(token) {
  if (!new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(token)) {
    throw new Error(`Enter the ${EMAIL_OTP_LENGTH}-digit verification code from your email.`);
  }
}

export async function sendEmailOtp(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  throwAuthError('sending signup verification email', error);
  return data;
}

async function verifyEmailOtp(email, token) {
  requireEmailOtp(token);

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  throwAuthError('verifying signup code', error);
  if (!data.user || !data.session) {
    throw new Error('Email verification did not create an authenticated session. Request a new code and try again.');
  }
  return data;
}

export async function completeSignup({
  email,
  token,
  password,
  metadata,
  profile,
}) {
  await verifyEmailOtp(email, token);

  const { data, error } = await supabase.auth.updateUser({
    password,
    data: metadata,
  });
  throwAuthError('updating verified signup account', error);
  if (!data.user) {
    throw new Error('Account verification succeeded, but the account could not be updated. Please sign in and try again.');
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    ...profile,
  });
  if (profileError) throw profileError;

  return data.user;
}

export async function uploadShelterDoc(userId, kind, file) {
  if (!file) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is larger than 10MB.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${userId}/${kind}.${ext}`;
  const { error } = await supabase.storage
    .from('shelter-docs')
    .upload(path, file, { upsert: true });
  throwAuthError('uploading shelter document', error);
  return path;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  throwAuthError('signing in with password', error);
  if (!data.user || !data.session) {
    throw new Error('Sign-in did not create a session. Check your email and password, then try again.');
  }
  return data;
}

export async function getUserRole(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && data?.role) return data.role;
  return user.user_metadata?.role || 'user';
}

export async function sendPasswordResetCode(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  throwAuthError('sending password-reset email', error);
  return data;
}

export async function verifyPasswordResetCode(email, token) {
  requireEmailOtp(token);

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  throwAuthError('verifying password-reset code', error);
  if (!data.user || !data.session) {
    throw new Error('Password-reset verification did not create an authenticated session. Request a new code and try again.');
  }
  return data;
}

export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  throwAuthError('updating password after reset', error);
  return data;
}
