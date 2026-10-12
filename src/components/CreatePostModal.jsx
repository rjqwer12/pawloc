import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import LostPetForm from './LostPetForm';
import FoundPetForm from './FoundPetForm';
import ReunitedStoryForm from './ReunitedStoryForm';
import PostPublished from './PostPublished';
import './CreatePostModal.css';

const options = [
  { value: 'lost', title: 'Report Lost Pet', badge: 'Lost Pet' },
  { value: 'found', title: 'Report Found Pet', badge: 'Found Pet' },
  { value: 'reunited', title: 'Share Reunited Story', badge: 'Reunited Story' },
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
        <h2 id="create-post-title" ref={heading} tabIndex={-1}>{category === 'lost' ? 'Create Lost Pet Post' : category === 'found' ? 'Create Found Pet Post' : selected?.title || 'Create Post'}</h2>
        <button className="create-post-close" type="button" onClick={onClose} aria-label="Close create post"><Icon name="close" /></button>
      </header>
      {!selected ? <div className="create-post-options">
        {options.map(option => <button key={option.value} className={`create-post-option create-post-option-${option.value}`} onClick={() => { setCategory(option.value); }} aria-label={option.title}>
          <span className="create-post-option-content"><span className="create-post-option-heading"><strong>{option.title}</strong><span className="create-post-option-badge">{option.badge}</span></span></span>
        </button>)}
      </div> : category === 'lost' ? <LostPetForm key="lost" onBack={() => setCategory(null)} onSubmit={async post => setPublished(await onCreate(post))} /> : category === 'found' ? <FoundPetForm key="found" onBack={() => setCategory(null)} onSubmit={async post => setPublished(await onCreate(post))} /> : <ReunitedStoryForm key="reunited" onBack={() => setCategory(null)} onSubmit={async post => setPublished(await onCreate(post))} />}
    </dialog>
  );
}
