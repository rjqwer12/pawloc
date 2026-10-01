import { useState } from 'react';
import Icon from './UserIcon';

function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export default function ReservationCalendar({ value, min, disabled, onChange }) {
  const [month, setMonth] = useState(() => new Date(`${value || min}T12:00:00`));
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7) * 7;
  const days = Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1, 12));
  const previousDisabled = dateKey(first).slice(0, 7) <= min.slice(0, 7);
  return <div className="srm-calendar-column">
    <div className="srm-selected-date" aria-live="polite"><Icon name="calendar" /><strong>{value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a visit date'}</strong>{value && <span>Selected</span>}</div>
    <div className="srm-calendar" aria-label="Visit date calendar">
      <header><button type="button" aria-label="Previous month" disabled={disabled || previousDisabled} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}>&lsaquo;</button><strong aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" disabled={disabled} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}>&rsaquo;</button></header>
      <div className="srm-calendar-week" aria-hidden="true">{['M','T','W','T','F','S','S'].map((day,index) => <span key={index}>{day}</span>)}</div>
      <div className="srm-calendar-days">{days.map(day => { const key = dateKey(day); return <button type="button" key={key} aria-label={`Visit date ${key}`} aria-pressed={value === key} className={day.getMonth() !== month.getMonth() ? 'outside-month' : ''} disabled={disabled || key < min} onClick={() => onChange(key)}>{day.getDate()}</button>; })}</div>
    </div>
  </div>;
}
