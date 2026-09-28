import { useEffect } from 'react';
import './ContactSupport.css';

export default function ContactSupport() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <main className="support-page">
      <article className="support-content">
        <h1 className="support-title">Contact Support</h1>

        <section className="support-section">
          <h2>How Can We Help?</h2>
          <p>
            We&apos;re here to help you with questions, concerns, and issues related to Pawloc. If you are experiencing a problem with your account, a pet report, communication features, or another part of the platform, please contact our support team.
          </p>
        </section>

        <section className="support-section">
          <h2>Before Contacting Us</h2>
          <p>When reporting an issue, please provide:</p>
          <ul>
            <li>Your Pawloc account information</li>
            <li>A brief description of the problem</li>
            <li>The report or pet involved, if applicable</li>
            <li>Screenshots or other relevant information, if available</li>
          </ul>
          <p>
            Please do not include passwords or other sensitive account information in your support request.
          </p>
        </section>

        <section className="support-section">
          <h2>Report a Safety or Community Concern</h2>
          <p>
            If you encounter spam, fake claims, harassment, inappropriate content, or suspicious activity on Pawloc, please report it to our support team so it can be reviewed.
          </p>
        </section>

        <section className="support-section support-contact">
          <h2>Support</h2>
          <p>
            Email: <a href="mailto:pawloc2026@gmail.com">pawloc2026@gmail.com</a>
          </p>
          <p>We aim to review support requests and community concerns as soon as possible.</p>
        </section>
      </article>
    </main>
  );
}
