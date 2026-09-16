import './Footer.css';

const footerLinks = [
  { label: 'About us', href: '#about' },
  { label: 'Contact Support', href: '#contact' },
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
        {footerLinks.map(({ label, href }) => (
          <a key={label} href={href} className="footer-link">
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
