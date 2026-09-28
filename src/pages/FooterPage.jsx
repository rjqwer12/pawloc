import { useEffect } from 'react';
import pages from '../data/footerPages.json';
import './ContactSupport.css';

export default function FooterPage({ page }) {
  const content = pages[page];
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  return <main className="support-page"><article className="support-content">
    <h1 className="support-title">{content.title}</h1>
    {content.intro && <p className="support-intro">{content.intro}</p>}
    {content.sections.map(section => <section className="support-section" key={section.heading}>
      <h2>{section.heading}</h2><p>{section.text}</p>
      {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>)}
  </article></main>;
}
