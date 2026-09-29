import { useEffect, useRef } from 'react';
import { fullPhoto } from '../lib/fullPhoto';
import './PostImageModal.css';

export default function PostImageModal({ src, alt, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => { element.close(); previousFocus?.focus(); };
  }, []);

  return (
    <dialog ref={dialog} className="post-image-modal" aria-label="Post photo" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <img src={fullPhoto(src)} alt={alt || 'Pet photo'} />
      <button type="button" className="post-image-close" aria-label="Close photo" onClick={onClose} autoFocus>&times;</button>
    </dialog>
  );
}
