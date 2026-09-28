import { Link } from 'react-router-dom';
import './Footer.css';

const footerLinks = [
  { label: 'About us', href: '/about-us' },
  { label: 'Contact Support', href: '/contact-support' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Community Guidelines', href: '/community-guidelines' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-copy">
        &copy; 2026 PAWLOC Rescue and Adoption Network. All rights reserved.
      </p>
      <nav className="footer-links" aria-label="Footer navigation">
        {footerLinks.map(({ label, href }) => (
          <Link key={label} to={href} className="footer-link">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
