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

export async function getShelterApproval(user) {
  if (user.user_metadata?.role !== 'shelter') return null;
  const { data, error } = await supabase.from('shelter_approvals').select('status').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Unable to check shelter approval. Please contact support or try again later.');
  if (data?.status === 'approved') return null;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('shelter_name, representative').eq('id', user.id).maybeSingle();
  if (profileError) throw profileError;
  return { status: data?.status || 'pending', name: profile?.shelter_name || user.user_metadata?.shelter_name || 'Shelter', owner: profile?.representative, email: user.email };
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
    type: 'email',
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}
