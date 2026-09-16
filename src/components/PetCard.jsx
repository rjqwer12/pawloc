import { useNavigate } from 'react-router-dom';
import './PetCard.css';

export default function PetCard({ pet }) {
  const navigate = useNavigate();

  return (
    <article className="pet-card">
      <div className="pet-card-image-wrap">
        <img src={pet.image} alt={pet.name} className="pet-card-image" loading="lazy" />
      </div>

      <div className="pet-card-body">
        <h3 className="pet-name">{pet.name}</h3>
        <p className="pet-meta">
          {pet.age} &bull; {pet.breed} &bull; {pet.gender}
        </p>
        <p className="pet-description">{pet.description}</p>
        <button type="button" className="pet-meet-btn" onClick={() => navigate('/')}>
          Meet {pet.name}
        </button>
      </div>
    </article>
  );
}
