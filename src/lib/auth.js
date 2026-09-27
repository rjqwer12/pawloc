import { supabase } from './supabase';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function sendEmailOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

async function verifyEmailOtp(email, token) {
  const first = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (!first.error) return first.data;

  const second = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  if (second.error) throw second.error;
  return second.data;
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
  if (error) throw error;

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
  if (error) throw error;
  return path;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function sendPasswordResetCode(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

export async function verifyPasswordResetCode(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}
