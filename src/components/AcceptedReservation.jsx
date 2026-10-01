import { Link } from 'react-router-dom';
import Icon from './UserIcon';

const escapeCalendar = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const calendarDate = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

export default function AcceptedReservation({ entry, onClose }) {
  const start = entry.visitAt ? new Date(entry.visitAt) : null;
  const validDate = start && Number.isFinite(start.getTime());
  const end = validDate ? new Date(start.getTime() + 30 * 60000) : null;
  const time = value => value.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
  function addToCalendar() {
    if (!validDate) return;
    const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PAWLOC//Adoption Visits//EN', 'BEGIN:VEVENT', `UID:${escapeCalendar(entry.id)}@pawloc`, `DTSTAMP:${calendarDate(new Date())}`, `DTSTART:${calendarDate(start)}`, `DTEND:${calendarDate(end)}`, `SUMMARY:${escapeCalendar(`Adoption visit: ${entry.title || 'Pet'}`)}`, `LOCATION:${escapeCalendar(entry.shelterLocation || entry.shelter)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'pawloc-adoption-visit.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <header className="accepted-heading"><h2 id="srm-title">Reservation Confirmed!</h2><p>Your adoption visit has been officially confirmed by the shelter staff.</p></header>
    <div className="accepted-summary">
      <div className="accepted-summary-header"><h3>Reservation Summary</h3><span><Icon name="check" />Confirmed Visit</span></div>
      <section className="accepted-date"><Icon name="calendar" /><div><strong>{validDate ? start.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : entry.visitSchedule || 'Schedule not provided'}</strong>{validDate && <small>{time(start)} – {time(end)} · Philippine time</small>}</div><button type="button" onClick={addToCalendar} disabled={!validDate}><Icon name="calendar" />Add to Calendar</button></section>
      <dl className="accepted-details"><div><dt>Adoptable Pet</dt><dd>{entry.title?.split(' (')[0] || 'Not provided'}<small>{entry.title?.match(/\((.*)\)/)?.[1]}</small></dd><dt>Shelter Name</dt><dd>{entry.shelter || 'Not provided'}</dd></div><div><dt>Applicant Name</dt><dd>{entry.fullName || 'Not provided'}</dd><dt>Contact Number</dt><dd>{entry.phone || 'Not provided'}</dd></div></dl>
      <section className="accepted-location"><span className="accepted-location-icon"><Icon name="pin" /></span><div><h3>Shelter Location</h3><p>{entry.shelterLocation || 'See the shelter listing for its location.'}</p></div>{entry.shelterId && <Link to={`/user/map?shelter=${entry.shelterId}`} onClick={onClose}><Icon name="map" />View Map</Link>}</section>
      <section className="accepted-guidelines"><h3><Icon name="warning" />Important Visit Guidelines</h3><ul><li>Please bring a valid ID for proof of name and your reservation confirmation.</li><li>You may bring a leash or collar if you plan to proceed with same-day take-home inspection.</li></ul></section>
    </div>
    <footer><button className="srm-primary" onClick={onClose}>Done</button></footer>
  </>;
}
