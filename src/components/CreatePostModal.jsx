import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import LostPetForm from './LostPetForm';
import FoundPetForm from './FoundPetForm';
import ReunitedStoryForm from './ReunitedStoryForm';
import PostPublished from './PostPublished';
import './CreatePostModal.css';

const options = [
  { value: 'lost', title: 'Report Lost Pet', badge: 'Lost Pet', icon: 'search', description: 'Post a missing pet alert to nearby shelters and rescue groups. Include the pet’s last known location to help with the search.' },
  { value: 'found', title: 'Report Found Pet', badge: 'Found Pet', icon: 'compass', description: 'Report the details of a stray or rescued pet you found. Help connect the pet with its owner and keep track of where it is being cared for.' },
  { value: 'reunited', title: 'Share Reunited Story', badge: 'Reunited Story 💚', icon: 'celebrate', description: 'Share the good news when a pet returns home or gets adopted. Thank the people who helped and mark the case as completed.' },
];

export default function CreatePostModal({ onClose, onCreate }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const [category, setCategory] = useState(null);



  const [published, setPublished] = useState(null);
  const selected = options.find(option => option.value === category);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => { heading.current?.focus(); }, [category]);

  if (published) return (
    <dialog ref={dialog} className={`create-post-modal create-post-modal-published${published.category === 'found' ? ' create-post-modal-found-published' : ''}`} aria-labelledby="create-post-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <PostPublished post={published} onClose={onClose} />
    </dialog>
  );

  return (
    <dialog ref={dialog} className={`create-post-modal${selected ? ' create-post-modal-lost' : ''}`} aria-labelledby="create-post-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <header className="create-post-header">
        <span className="create-post-heading-icon"><Icon name="megaphone" /></span>
        <h2 id="create-post-title" ref={heading} tabIndex={-1}>{category === 'lost' ? 'Create Lost Pet Post' : category === 'found' ? 'Create Found Pet Post' : selected?.title || 'Create Post'}</h2>
        <button className="create-post-close" type="button" onClick={onClose} aria-label="Close create post"><Icon name="close" /></button>
      </header>
      {!selected ? <div className="create-post-options">
        {options.map(option => <button key={option.value} className={`create-post-option create-post-option-${option.value}`} onClick={() => { setCategory(option.value); }} aria-label={option.title}>
          <span className="create-post-option-icon"><Icon name={option.icon} /></span>
          <span className="create-post-option-content"><span className="create-post-option-heading"><strong>{option.title}</strong><span className="create-post-option-badge"><Icon name={option.value === 'reunited' ? 'heart' : 'warning'} />{option.badge}</span></span><span className="create-post-option-description">{option.description}</span></span>
        </button>)}
      </div> : category === 'lost' ? <LostPetForm key="lost" onBack={() => setCategory(null)} onSubmit={post => setPublished(onCreate(post))} /> : category === 'found' ? <FoundPetForm key="found" onBack={() => setCategory(null)} onSubmit={post => setPublished(onCreate(post))} /> : <ReunitedStoryForm key="reunited" onBack={() => setCategory(null)} onSubmit={post => setPublished(onCreate(post))} />}
    </dialog>
  );
}
