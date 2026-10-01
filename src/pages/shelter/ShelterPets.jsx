import MarkAdoptedModal from '../../components/MarkAdoptedModal';
import { useEffect, useRef, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { listRecords, saveRecord, uploadImage } from '../../lib/userData';
import { userPets } from '../../data/userPets';
import './ShelterPets.css';

const samples = [userPets[0], userPets[1], userPets[0], userPets[1]].map((pet,index) => ({ ...pet, id: `shelter-preview-${index}`, name: index % 2 ? 'Luna' : 'Cooper', species: pet.type, age: index % 2 ? '1 yr' : '2 yrs', breed: index % 2 ? 'Calico Cat' : 'Golden Retriever', description: index % 2 ? 'Spayed, indoor only, microchipped, gentle temperament.' : 'Friendly, energetic, vaccinated, leash trained.' }));
const groups = [['all','All'], ['dog','Dogs'], ['cat','Cats'], ['other','Others']];
const species = pet => (pet.species || pet.type || '').trim().toLowerCase();
const matches = (pet, group) => group === 'all' || (group === 'other' ? !['dog','cat'].includes(species(pet)) : species(pet) === group);

function PetEditor({ pet, onSave, onClose, preview }) {
  const dialog = useRef(null);
  const reader = useRef(null);
  const [draft, setDraft] = useState({ name: '', species: '', breed: '', age: '', gender: 'Male', description: '', image: '', ...pet, species: pet?.species || pet?.type || '' });
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; const focus = document.activeElement; element.showModal(); return () => { reader.current?.abort(); element.close(); focus?.focus(); }; }, []);
  const change = field => event => setDraft(current => ({ ...current, [field]: event.target.value }));
  function photo(event) {
    const file = event.target.files?.[0]; if (!file) return;
    reader.current?.abort(); setReading(false);
    if (!['image/jpeg','image/png'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) { setError('Choose a JPG or PNG photo up to 10 MB.'); event.target.value = ''; return; }
    setReading(true); setError(''); const next = new FileReader(); reader.current = next;
    next.onload = () => { setDraft(current => ({ ...current, image: next.result })); setReading(false); };
    next.onerror = () => { setReading(false); setError('Unable to read the photo.'); }; next.readAsDataURL(file);
  }
  return <dialog ref={dialog} className={`shelter-pet-editor adoption-post-form${success ? ' adoption-post-success' : ''}`} aria-labelledby="pet-editor-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    {success ? <section className="adoption-success-content"><span className="adoption-success-icon"><Icon name="check" /></span><h2 id="pet-editor-title">{pet ? 'Post updated successfully!' : 'Posted successfully!'}</h2><p>{preview ? 'Preview saved. This pet post has not been published to the database.' : 'Your pet post has been published and is now visible to other users.'}</p><button className="shelter-pet-primary" onClick={onClose}>Done</button></section> : <><header><div><h2 id="pet-editor-title">{pet ? 'Edit Pet Post' : 'Add New Adoption Post'}</h2><p>{pet ? 'Update listing for adoption or showcase a pet profile' : 'Create a listing for adoption or showcase a pet profile'}</p></div><button disabled={busy} onClick={onClose} aria-label="Close pet form"><Icon name="close" /></button></header>
    <form onSubmit={async event => { event.preventDefault(); if (busy || reading) return; if (!draft.image) { setError('A pet photo is required.'); return; } const clean = { ...draft }; for (const field of ['name','species','breed','age','description']) { clean[field] = clean[field].trim(); if (!clean[field]) { setError('Please complete all required fields.'); return; } } setBusy(true); setError(''); try { await onSave(clean); setSuccess(true); } catch(err) { setError(err.message); } finally { setBusy(false); } }}>
      <div className="shelter-pet-fields">
        <label>Pet Name <span>*</span><input value={draft.name} onChange={change('name')} required maxLength={100} disabled={busy} placeholder="e.g., Cooper" /></label>
        <label>Species <span>*</span><input value={draft.species} onChange={change('species')} required maxLength={100} disabled={busy} placeholder="e.g., Dog, Cat" /></label>
        <label>Breed <span>*</span><input value={draft.breed} onChange={change('breed')} required maxLength={100} disabled={busy} placeholder="e.g., Golden Retriever" /></label>
        <fieldset className="adoption-age-gender"><legend>Age &amp; Gender <span>*</span></legend><div><input aria-label="Age" value={draft.age} onChange={change('age')} required maxLength={100} disabled={busy} placeholder="e.g., 2 yrs" /><select aria-label="Gender" value={draft.gender} onChange={change('gender')} disabled={busy}><option>Male</option><option>Female</option><option>Unknown</option></select></div></fieldset>
      </div>
      <label>Description <span>*</span><textarea value={draft.description} onChange={change('description')} required maxLength={2000} rows={4} disabled={busy} placeholder="Friendly, energetic, vaccinated, leash trained." /></label>
      <label className="adoption-photo-label">Upload Pet Photo <span>*</span><div className="adoption-upload-zone"><Icon name="camera" /><strong>{reading ? 'Reading photo...' : 'Upload Photo'}</strong><small>PNG or JPG up to 10 MB</small>{draft.image && <span className="adoption-selected-photo"><Icon name="check" />Photo selected</span>}<input aria-label="Upload Pet Photo" type="file" accept="image/jpeg,image/png" required={!draft.image} onChange={photo} disabled={busy} /></div></label>
      {error && <p role="alert">{error}</p>}<footer><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="shelter-pet-primary" disabled={busy || reading}>{reading ? 'Reading photo...' : busy ? 'Saving...' : pet ? 'Save Changes' : 'Publish Post'}</button></footer>
    </form></>}
  </dialog>;
}

export default function ShelterPets() {
  const { user, loading: authLoading } = useAuth();
  const [pets,setPets] = useState([]); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
  const [filter,setFilter] = useState('all'); const [editor,setEditor] = useState(null); const [adopting,setAdopting] = useState(null);
  useEffect(() => { if (authLoading) return; let active = true; setLoading(true); setError(''); if (!user) { setPets(samples); setLoading(false); return; } listRecords('pet',true).then(rows => { if (active) setPets(rows); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active=false; }; }, [user?.id,authLoading]);
  async function save(draft) {
    let next = { ...draft, type: draft.species.toLowerCase(), species: draft.species.toLowerCase(), status: draft.status || 'Available' };
    if (user) {
      const shelters = await listRecords('shelter',true); const shelter = shelters[0];
      next = { ...next, image: await uploadImage(next.image), shelter: shelter?.name || user.user_metadata?.shelter_name || 'Shelter', shelterId: shelter?.id || next.shelterId, shelterLocation: shelter?.landmark || next.shelterLocation };
      next = await saveRecord('pet',next,draft.id);
    } else next = { ...next, id: draft.id || `preview-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-')}` };
    setPets(current => draft.id ? current.map(pet => pet.id===draft.id ? next : pet) : [next,...current]);
  }
  const visible = pets.filter(pet => matches(pet,filter));
  return <UserLayout><main className="shelter-pets-main"><header className="shelter-pets-heading"><h1>Pet Posts</h1><button className="shelter-pet-primary" onClick={() => setEditor({})}><Icon name="plus" />Post For Adoption</button></header>
    <div className="shelter-pet-filters" aria-label="Filter pet posts">{groups.map(([value,label]) => <button key={value} aria-pressed={filter===value} onClick={() => setFilter(value)}>{label}<span>{pets.filter(pet => matches(pet,value)).length}</span></button>)}</div>
    {loading && <p role="status">Loading pet posts...</p>}{error && <p role="alert">{error}</p>}
    <section className="shelter-pets-grid" aria-label="Shelter pet posts">{visible.map(pet => <article className="shelter-owned-pet" key={pet.id}><div className="shelter-owned-photo"><img src={pet.image} alt={pet.name} /><span>{pet.status === 'Adopted' ? 'Successfully Adopted' : 'For Adoption'}</span></div><h2>{pet.name}</h2><p>{pet.breed} &bull; {pet.age}</p><p className="shelter-owned-description">{pet.description}</p><footer>{pet.status === 'Adopted' ? <button className="shelter-pet-adopted" disabled>Successfully Adopted</button> : <><button onClick={() => setEditor(pet)} aria-label={`Edit ${pet.name}`}><Icon name="edit" />Edit</button><button className="shelter-pet-primary" disabled={pet.status==='Adopted'} onClick={() => setAdopting(pet)}>{pet.status==='Adopted' ? 'Adopted' : 'Mark Adopted'}</button></>}</footer></article>)}</section>
    {!loading && !error && !visible.length && <p>No pet posts in this category yet.</p>}{!user && !authLoading && <p className="shelter-pets-preview">Preview mode. Changes last until this page is reloaded.</p>}
  </main>{editor && <PetEditor preview={!user} pet={editor.id ? editor : null} onSave={save} onClose={() => setEditor(null)} />}{adopting && <MarkAdoptedModal preview={!user} pet={adopting} onClose={() => setAdopting(null)} onConfirm={applicant => save({ ...adopting, species: species(adopting), status: 'Adopted', adoptedAt: new Date().toISOString(), adoptionReservationId: applicant?.id || null })} />}</UserLayout>;
}
