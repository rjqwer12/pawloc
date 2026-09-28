import { supabase } from './supabase';

function check(error) {
  if (error?.code === '23505') throw new Error('You already have an active request or reaction for this item. Refresh to see its status.');
  if (error) throw new Error(/schema cache|does not exist/i.test(error.message) ? 'Database setup is required. Run supabase/user-features.sql in your Supabase SQL Editor.' : error.message);
}
export async function currentUser() {
  const { data, error } = await supabase.auth.getUser(); check(error);
  if (!data.user) throw new Error('Sign in with a real account to save to the database. The test login is a preview only.');
  return data.user;
}
const unpack = row => ({ ...row.data, id: row.id, ownerId: row.owner_id, recipientId: row.recipient_id, database: true, createdAt: row.created_at, parentId: row.parent_id, time: new Date(row.created_at).toLocaleString() });
export async function listRecords(kind, mine = false) {
  let query = supabase.from('user_records').select('*').eq('kind', kind).order('created_at', { ascending: false });
  if (mine) query = query.eq('owner_id', (await currentUser()).id);
  const { data, error } = await query; check(error); return data.map(unpack);
}
export async function saveRecord(kind, payload, id, recipientId = null, parentId = null) {
  const user = await currentUser();
  const { id: _id, ownerId: _owner, recipientId: _recipient, database: _db, time: _time, createdAt: _created, parentId: _parent, ...data } = payload;
  const query = id
    ? supabase.from('user_records').update({ data }).eq('id', id).eq('owner_id', user.id)
    : supabase.from('user_records').insert({ kind, data, owner_id: user.id, recipient_id: recipientId, parent_id: parentId });
  const result = await query.select().single(); check(result.error); return unpack(result.data);
}
export async function deleteRecord(id) {
  const user = await currentUser();
  const { error } = await supabase.from('user_records').delete().eq('id', id).eq('owner_id', user.id); check(error);
}
export async function uploadImage(image) {
  if (!image?.startsWith('data:')) return image;
  const user = await currentUser();
  const blob = await (await fetch(image)).blob();
  if (!['image/png', 'image/jpeg'].includes(blob.type) || !blob.size || blob.size > 10 * 1024 * 1024) throw new Error('Choose a JPG or PNG image up to 10 MB.');
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${blob.type === 'image/png' ? 'png' : 'jpg'}`;
  const { error } = await supabase.storage.from('user-images').upload(path, blob); check(error);
  return supabase.storage.from('user-images').getPublicUrl(path).data.publicUrl;
}
export async function savePost(post, id) {
  const user = await currentUser();
  return saveRecord('post', { ...post, image: await uploadImage(post.image), author: user.user_metadata?.first_name || 'Member' }, id);
}
export async function reservePet(pet, details) {
  return saveRecord('reservation', { category: 'reservation', title: `${pet.name} (${pet.breed})`, image: pet.image, petId: pet.id, shelter: pet.shelter, shelterId: pet.shelterId, ...details, status: 'pending', description: 'Adoption inquiry submitted. Awaiting shelter review.' }, null, pet.ownerId, pet.id);
}
export async function cancelReservation(id) {
  const { error } = await supabase.rpc('cancel_user_reservation', { reservation_id: id }); check(error);
}
export async function saveProfile(profile) {
  const user = await currentUser();
  const photo = await uploadImage(profile.photo);
  const metadata = { first_name: profile.firstName, middle_name: profile.middleName, last_name: profile.lastName, avatar_url: photo };
  const { error } = await supabase.auth.updateUser({ data: metadata }); check(error);
  const { error: profileError } = await supabase.from('profiles').update({ first_name: profile.firstName, middle_name: profile.middleName, last_name: profile.lastName }).eq('id', user.id); check(profileError);
  return { ...profile, photo };
}

export async function deleteAccount() {
  const user = await currentUser();
  // Storage files must be removed before deleting their auth owner.
  for (const bucket of ['user-images', 'shelter-docs']) {
    let remaining = true;
    while (remaining) {
      const { data, error } = await supabase.storage.from(bucket).list(user.id, { limit: 100 }); check(error);
      remaining = data.length > 0;
      if (remaining) {
        const result = await supabase.storage.from(bucket).remove(data.map(file => `${user.id}/${file.name}`)); check(result.error);
      }
    }
  }
  const { error } = await supabase.rpc('delete_own_account'); check(error);
  await supabase.auth.signOut();
}
