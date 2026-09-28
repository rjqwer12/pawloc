import { useEffect, useRef, useState } from 'react';
import { currentUser, listRecords, saveRecord } from '../lib/userData';

export default function PostComments({ post, onClose }) {
  const dialog = useRef(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement; let active = true; element.showModal();
    listRecords('comment').then(rows => { if (active) setComments(rows.filter(row => row.postId === post.id).reverse()); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; element.close(); focus?.focus(); };
  }, [post.id]);
  return <dialog ref={dialog} className="user-inbox" aria-labelledby="comments-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id="comments-title">Comments</h2>
    {comments.map(comment => <article key={comment.id}><strong>{comment.author}</strong><p>{comment.text}</p></article>)}
    <form onSubmit={async event => { event.preventDefault(); if (!text.trim()) return; setBusy(true); setError(''); try { const user = await currentUser(); const comment = await saveRecord('comment', { postId: post.id, text: text.trim(), author: user.user_metadata?.first_name || 'Member' }, null, null, post.id); setComments(current => [...current, comment]); setText(''); } catch(error) { setError(error.message); } finally { setBusy(false); } }}>
      <label>Your comment<textarea value={text} onChange={event => setText(event.target.value)} required maxLength={2000} /></label>
      {error && <p role="alert">{error}</p>}<button disabled={busy} type="submit">Send comment</button>
    </form><button onClick={onClose}>Close</button>
  </dialog>;
}
