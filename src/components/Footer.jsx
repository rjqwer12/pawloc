import { Link } from 'react-router-dom';
import './Footer.css';

const footerLinks = [
  { label: 'About us', href: '#about' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Community Guidelines', href: '#guidelines' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-copy">
        &copy; 2026 PAWLOC Rescue and Adoption Network. All rights reserved.
      </p>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link to="/contact-support" className="footer-link">
          Contact Support
        </Link>
        {footerLinks.map(({ label, href }) => (
          <a key={label} href={href} className="footer-link">
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
