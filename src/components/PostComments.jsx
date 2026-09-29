import { useEffect, useRef, useState } from 'react';
import { currentUser, listRecords, saveRecord } from '../lib/userData';
import { fullPhoto } from '../lib/fullPhoto';
import './PostComments.css';

export default function PostComments({ post, onClose }) {
  const dialog = useRef(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(post.database));
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement; let active = true; element.showModal();
    if (post.database) listRecords('comment').then(rows => { if (active) setComments(rows.filter(row => row.postId === post.id).reverse()); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; element.close(); focus?.focus(); };
  }, [post.id]);
  return <dialog ref={dialog} className="story-comments-modal" aria-labelledby="comments-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <button className="story-comments-close" onClick={onClose} aria-label="Close story" autoFocus>&times;</button>
    {post.image && <div className="story-comments-photo"><img src={fullPhoto(post.image)} alt={post.alt || post.title} /></div>}
    <section className="story-comments-content">
    <h3>{post.title}</h3>
    <h2 id="comments-title">Comments</h2>
    {loading && <p role="status">Loading comments...</p>}
    {!loading && !comments.length && <p>No comments yet.</p>}
    {comments.map(comment => <article key={comment.id}><strong>{comment.author}</strong><p>{comment.text}</p></article>)}
    {post.database && <form onSubmit={async event => { event.preventDefault(); if (busy || !text.trim()) return; setBusy(true); setError(''); try { const user = await currentUser(); const comment = await saveRecord('comment', { postId: post.id, text: text.trim(), author: user.user_metadata?.first_name || 'Member' }, null, null, post.id); setComments(current => [...current, comment]); setText(''); } catch(error) { setError(error.message); } finally { setBusy(false); } }}>
      <label>Your comment<textarea value={text} onChange={event => setText(event.target.value)} required maxLength={2000} /></label>
      {error && <p role="alert">{error}</p>}<button disabled={busy} type="submit">Send comment</button>
    </form>}
    {!post.database && <p>Sign in and open a published story to comment.</p>}
    {error && !comments.length && <p role="alert">{error}</p>}
    </section>
  </dialog>;
}
