import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Icon from './UserIcon';
import './PostPublished.css';

export default function PostPublished({ post, onClose }) {
  const navigate = useNavigate();
  const isFound = post.category === 'found';
  const isReunited = post.category === 'reunited';
  const petName = isFound ? post.animalType || 'Unidentified pet' : post.petName;
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return (
    <div className={`post-published${isFound ? ' post-published-found' : ''}${isReunited ? ' post-published-reunited' : ''}`}>
      <span className="post-published-check" aria-hidden="true">✓</span>
      <h2 id="create-post-title" ref={heading} tabIndex={-1}>{isReunited ? 'Reunited Story Shared Successfully!' : 'Post Published Successfully!'}</h2>
      <p className="post-published-intro">{isReunited ? 'Your homecoming story is now in your news feed, bringing hope to searching pet parents.' : <>Your {isFound ? 'found' : 'lost'} pet post for <strong>{petName}</strong> is now in your feed and library.</>}</p>
      <article className="post-published-card">
        <div className="post-published-details">
          <div className="post-published-photo">{post.image ? <img src={post.image} alt={post.alt} /> : <><Icon name="camera" /><span>{post.attachment?.name || 'Pet photo'}</span></>}</div>
          <div><span className="post-published-tag"><Icon name={isReunited ? 'heart' : 'warning'} />{isReunited ? 'Reunited Story 💚' : isFound ? 'Found Pet' : 'Lost Pet'}</span><h3>{isReunited ? post.title : petName}</h3>{post.breed && <p>{post.breed}</p>}{isReunited ? <p className="post-published-reunion-date">Date found: {post.dateFound}</p> : <p className="post-published-location"><Icon name="pin" /><span><strong>{isFound ? 'Found near:' : 'Last seen:'}</strong> {post.location}</span></p>}</div>
        </div>
        <p className="post-published-description">“{post.description}”</p>
      </article>
      <button className="post-published-view" onClick={() => { onClose(); navigate(`/user/${isReunited ? 'home' : 'library'}?post=${post.id}`); }}>{isReunited ? 'View Live Story in News Feed' : 'View Live Post in Library'}</button>
      <p className="post-published-note">{post.database ? 'Saved to the community feed and your Library.' : 'Preview only. This post has not been sent to shelters.'}</p>
    </div>
  );
}
