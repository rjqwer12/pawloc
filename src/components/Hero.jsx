import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <h1 className="hero-title">
        Lost <span className="hero-highlight">paw.</span>
        <br />
        Found hope.
        <br />
        Bring them home.
      </h1>
      <p className="hero-subtitle">
        Every missing pet deserves a way home. Share sightings, search nearby
        reports and help make a reunion happen. Hope. Care. Community.
      </p>
      <button type="button" className="btn btn-primary hero-cta">
        Learn More
      </button>
    </section>
  );
}
