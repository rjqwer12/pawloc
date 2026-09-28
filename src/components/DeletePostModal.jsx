import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import './DeletePostModal.css';

export default function DeletePostModal({ post, onDelete, onClose }) {
  const dialog = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    element.showModal();
    return () => { element.close(); if (focus?.isConnected) focus.focus(); };
  }, []);
  return <dialog ref={dialog} className="delete-post-modal" aria-labelledby="delete-post-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={`delete-post-badge${deleted ? ' delete-post-badge-success' : ''}`} aria-hidden="true">{deleted ? <span>&#10003;</span> : <Icon name="delete" />}</div>
    <h2 id="delete-post-title">{deleted ? 'Post Deleted Successfully' : 'Delete Post'}</h2>
    {deleted ? <><p>{post.database ? 'Your post has been deleted from the community feed and your Library.' : 'Your post has been removed from this Library preview. You can restore it using Undo delete.'}</p><button className="delete-post-done" onClick={onClose}>Done</button></> : <>
      <h3>Are you sure you want to delete this post?</h3>
      <p className="delete-post-name">{post.title}</p>
      <p>{post.database ? 'This permanently deletes the post and its related messages, comments, and reports. This cannot be undone.' : 'This removes the post from your Library preview. No server data is deleted.'}</p>
      <div className="delete-post-actions"><button onClick={onClose}>Cancel</button><button disabled={busy} onClick={async () => { setBusy(true); try { await onDelete(post); setDeleted(true); } catch(error) { setError(error.message); } finally { setBusy(false); } }}>Delete Post</button></div>
    </>}
    {error && <p role="alert">{error}</p>}
  </dialog>;
}
