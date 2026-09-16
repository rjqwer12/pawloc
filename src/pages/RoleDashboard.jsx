import { useAuth } from '../lib/AuthContext';
import './RoleDashboard.css';

const dashboardCopy = {
  shelter: {
    eyebrow: 'SHELTER WORKSPACE',
    title: 'Manage your shelter community.',
    description: 'Review your listings, keep pet records current, and help adopters find their next companion.',
    actions: ['Manage adoptable pets', 'Review applications', 'Update shelter profile'],
  },
  admin: {
    eyebrow: 'PAWLOC ADMIN',
    title: 'Keep the network moving.',
    description: 'Monitor partner shelters, review reports, and maintain a trusted rescue network.',
    actions: ['Review shelter partners', 'Moderate reports', 'View network activity'],
  },
};

export default function RoleDashboard({ role }) {
  const { user } = useAuth();
  const content = dashboardCopy[role];

  return (
    <main className="role-dashboard">
      <section className="role-dashboard-hero">
        <p className="role-dashboard-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="role-dashboard-description">{content.description}</p>
        <p className="role-dashboard-user">Signed in as {user?.email}</p>
      </section>
      <section className="role-dashboard-actions" aria-label="Dashboard actions">
        {content.actions.map((action) => <button type="button" key={action}>{action}</button>)}
      </section>
    </main>
  );
}
