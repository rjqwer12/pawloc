import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import './LostPetForm.css';

export default function LostPetForm({ onBack, onSubmit, category = 'lost' }) {
  const isFound = category === 'found';
  const isReunited = category === 'reunited';
  const [upload, setUpload] = useState(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const reader = useRef(null);

  useEffect(() => () => reader.current?.abort(), []);

  function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    reader.current?.abort();
    setUpload(null);
    setError('');
    setReading(false);
    if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) {
      setError('Choose a PNG, JPG, or PDF file up to 10 MB.');
      event.target.value = '';
      return;
    }
    const next = new FileReader();
    reader.current = next;
    setReading(true);
    next.onload = () => { setUpload({ name: file.name, type: file.type, url: next.result }); setReading(false); };
    next.onerror = () => { setError('Unable to read this file. Please choose another.'); setReading(false); };
    next.readAsDataURL(file);
  }

  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('petName').trim();
    const breed = (data.get('breed') || '').trim();
    const location = (data.get('location') || '').trim();
    const dateFound = (data.get('dateFound') || '').trim();
    const description = data.get('description').trim();
    if (!upload || !description || (isReunited ? !name || !dateFound : (!isFound && (!name || !breed)) || !location)) {
      setError('Please upload a photo or PDF and complete every required field.');
      return;
    }
    const petLabel = name || 'Unidentified pet';
    if (isReunited) {
      onSubmit({ category, title: name, dateFound, description,
        ...(upload.type === 'application/pdf' ? { attachment: upload } : { image: upload.url, alt: `Reunion photo: ${name}` }),
      });
      return;
    }
    onSubmit({ category, title: `${petLabel}${breed ? ` (${breed})` : ''}`, ...(isFound ? { animalType: name } : { petName: name }), breed, location, description,
      ...(upload.type === 'application/pdf' ? { attachment: upload } : { image: upload.url, alt: `Photo of ${petLabel}` }),
    });
  }

  return (
    <form className="lost-pet-form" onSubmit={submit}>
      <div className="lost-pet-photo-field">
        <h3>{isReunited ? 'Upload Reunion / Homecoming Photos' : isFound ? 'Found Pet Photos' : 'Pet Photos'}</h3>
        <label className={`lost-pet-upload${upload ? ' lost-pet-upload-selected' : ''}`}>
          <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={chooseFile} aria-label="Upload pet photo or PDF" required aria-describedby="lost-upload-help" />
          {upload?.type.startsWith('image/') ? <img src={upload.url} alt="Selected pet photo" /> : <span className="lost-pet-camera"><Icon name="camera" /></span>}
          <strong>{reading ? 'Reading file…' : upload ? 'Change file' : <>Upload Photo <span className="lost-pet-required">*</span></>}</strong>
          <span id="lost-upload-help">{upload ? upload.name : 'PDF, PNG, JPG up to 10MB'}</span>
        </label>
      </div>
      <div className="lost-pet-field-row">
        <label><span>{isFound ? <>Animal Type <span className="pet-field-optional">(Optional)</span></> : <>{isReunited ? 'Title/Pet Name' : 'Pet Name'} <span className="lost-pet-required">*</span></>}</span><input name="petName" required={!isFound} maxLength={isReunited ? 120 : 80} placeholder={isReunited ? 'e.g., Barnaby is finally home safe!' : isFound ? 'e.g., Cat, Dog' : 'e.g., Barbilat'} /></label>
        {isReunited ? <label><span>Date Found <span className="lost-pet-required">*</span></span><input name="dateFound" required maxLength={80} placeholder="e.g., Today, Yesterday, Oct 25 2026" /></label> : <label><span>{isFound ? <>Suspected Breed <span className="pet-field-optional">(Optional)</span></> : <>Species &amp; Breed <span className="lost-pet-required">*</span></>}</span><input name="breed" required={!isFound} maxLength={120} placeholder={isFound ? 'e.g., Golden Retriever / Labrador mix' : 'e.g., Golden Retriever mix'} /></label>}
      </div>
      {!isReunited && <label><span>{isFound ? 'Found / Location' : 'Last Seen Location'} <span className="lost-pet-required">*</span></span><input name="location" required maxLength={200} placeholder={isFound ? 'e.g., Pavia, Iloilo' : 'e.g., Rob Pavia'} /></label>}
      <label><span>{isReunited ? 'Story Description' : 'Description'} <span className="lost-pet-required">*</span></span><textarea name="description" required maxLength={2000} rows={isFound || isReunited ? 3 : 2} placeholder={isReunited ? 'Share how they were found, thank dispatch spotters, volunteers, shelters, or veterinary clinics who assisted, and describe the happy homecoming moment...' : isFound ? 'Describe physical condition, tag engravings or phone numbers, temperament (friendly, nervous), where currently being kept safely...' : 'Red nylon collar with silver bell. Very food-motivated, timid around loud delivery trucks. Call name softly...'} /></label>
      {error && <p className="lost-pet-error" role="alert">{error}</p>}
      <div className="lost-pet-actions"><button type="button" onClick={onBack}>Back to Categories</button><button type="submit" disabled={reading}>{reading ? 'Loading…' : 'Post'}</button></div>
    </form>
  );
}
