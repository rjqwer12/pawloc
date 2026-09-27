import UserLayout from '../../components/UserLayout';
import { Link } from 'react-router-dom';
import Icon from '../../components/UserIcon';
import { shelters } from '../../data/shelters';
import './UserShelters.css';

export default function UserShelters() {
  return (
    <UserLayout>
      <main className="user-shelters-main">
        <h1>Animal Shelters</h1>
        <div className="user-shelter-filters">
          <button className="user-shelter-filter-active" aria-pressed="true">All Shelters <span>{shelters.length}</span></button>
          <Link to="/user/map">Near Me</Link>
        </div>
        <div className="user-shelter-grid">
          {shelters.map(shelter => (
            <article className="user-shelter-card" key={shelter.id}>
              <p className="user-shelter-open"><span aria-hidden="true" />{shelter.status}</p>
              <div className="user-shelter-identity">
                <div className="user-shelter-thumbnail" aria-hidden="true"><Icon name="shelter" /></div>
                <div>
                  <h2>{shelter.name}</h2>
                  <p className="user-shelter-address"><Icon name="pin" /><span>{shelter.distance} · {shelter.landmark}</span></p>
                </div>
              </div>
              <ul className="user-shelter-services" aria-label="Animals sheltered"><li>{shelter.species}</li></ul>
              <div className="user-shelter-details">
                <a href={`tel:+${shelter.phone.replace(/\D/g, '')}`}><Icon name="phone" />{shelter.phone}</a>
                <span>{shelter.hours}</span>
              </div>
              <Link className="user-shelter-directions" to={`/user/map?shelter=${shelter.id}`} aria-label={`Directions to ${shelter.name}`}>Directions</Link>
            </article>
          ))}
        </div>
        <p className="user-shelter-preview">Sample listings for preview. Shelter details are not live.</p>
      </main>
    </UserLayout>
  );
}
