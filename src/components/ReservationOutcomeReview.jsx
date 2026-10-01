import Icon from './UserIcon';

function dateLabel(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Not recorded';
  return new Date(value).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export default function ReservationOutcomeReview({ entry, cancelled }) {
  if (cancelled) return <div className="cancelled-review-content">
    <span className="cancelled-review-icon" aria-hidden="true"><Icon name="close" /></span>
    <h2 id="srm-title">Reservation Cancelled</h2>
    <p>The adoption reservation has been cancelled. This request is no longer awaiting shelter review.</p>
    <section className="cancelled-review-details"><h3>Cancellation Details</h3><strong>Applicant Cancelled Reservation</strong><p>{entry.cancellationReason || `${entry.fullName || 'The applicant'} cancelled this reservation.`}</p>{entry.cancelledAt && <p>Cancelled at: {dateLabel(entry.cancelledAt)}</p>}</section>
  </div>;
  return <>
    <header><h2 id="srm-title">Reservation Request</h2><p>The reservation request has been rejected and shelter operational records have been updated.</p></header>
    <section className="rejected-review-meta"><div><h3>{entry.title?.split(' (')[0] || 'Pet reservation'}{entry.title?.match(/\((.*)\)/)?.[1] && <span className="srm-breed">{entry.title.match(/\((.*)\)/)[1]}</span>}</h3><p>Applicant: <strong>{entry.fullName || 'Not provided'}</strong>{[entry.phone, entry.address].filter(Boolean).map(value => <span key={value}> &bull; {value}</span>)}</p></div><div className="rejected-review-dates"><span><Icon name="calendar" />Application Date: {entry.requestedVisitAt || entry.visitAt ? dateLabel(entry.requestedVisitAt || entry.visitAt) : entry.visitSchedule || 'Not scheduled'}</span><span><Icon name="calendar" />Rejected at: {dateLabel(entry.reviewedAt)}</span></div></section>
    <section className="rejected-review-summary"><h3>Determination &amp; Record Summary</h3><p>{entry.rejectionReason || 'No rejection reason was recorded.'}</p></section>
  </>;
}
