import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <h1 className="hero-title">
        <span className="hero-line">
          Lost paw.
        </span>
        <span className="hero-line">
          Found <span className="hero-highlight">hope</span>.
        </span>
        <span className="hero-line">Bring them home.</span>
      </h1>
      <p className="hero-subtitle">
        <span>Every missing pet deserves a way home.</span>
        <span>Share sightings, search nearby reports and help make a reunion happen.</span>
        <span>Hope. Care. Community.</span>
      </p>
    </section>
  );
}
