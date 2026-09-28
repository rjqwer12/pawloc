import { useEffect, useRef } from 'react';
import LostPetForm from './LostPetForm';
import Icon from './UserIcon';
import './CreatePostModal.css';
import './EditPostModal.css';

export default function EditPostModal({ post, onClose, onSave }) {
  const dialog = useRef(null);
  const titles = { lost: 'Edit Lost Pet Post', found: 'Edit Found Pet Post', reunited: 'Edit Reunited Story' };
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={dialog} className="create-post-modal create-post-modal-lost edit-post-modal" aria-labelledby="edit-post-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="create-post-header"><span className="create-post-heading-icon"><Icon name="edit" /></span><h2 id="edit-post-title">{titles[post.category]}</h2><button className="create-post-close" type="button" onClick={onClose} aria-label="Close edit post"><Icon name="close" /></button></header>
    <LostPetForm category={post.category} initialPost={post} onBack={onClose} onSubmit={async changes => await onSave({ ...post, image: undefined, attachment: undefined, ...changes })} />
  </dialog>;
}
