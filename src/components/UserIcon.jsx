export default function UserIcon({ name, ...props }) {
  const paths = {
    profile: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-3a8 6 0 0 1 16 0v3z',
    delete: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    calendar: 'M3 5h18v16H3z M3 10h18 M7 3v4 M17 3v4 M7 14h2 M12 14h2 M7 18h2',
    camera: 'M15 6H9l-2 3H3v12h18V9h-4z M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M20 2v5 M17.5 4.5h5',
    close: 'M6 6l12 12 M18 6 6 18',
    megaphone: 'M3 10h6l7-5v14l-7-5H3z M7 14v6 M20 6l2-2 M20 12h3 M20 18l2 2',
    search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l7 7',
    compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M8 8l3 5 5 3-3-5z M12 2v2 M12 20v2 M2 12h2 M20 12h2',
    celebrate: 'm3 21 4-12 8 8z M7 9l8 8 M13 9l2-3 M16 12l4-1 M11 5V3 M18 6l3-3 M20 16h2 M7 5H6 M16 20v2',
    warning: 'm12 3 10 18H2z M12 9v5 M12 17v1',
    home: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
    shelter: 'm12 3 8 3v5c0 5-8 10-8 10S4 16 4 11V6z',
    paw: 'M8 13c-5 5-2 9 4 6 6 3 9-1 4-6-2-3-6-3-8 0z M5 6v3 M10 3v3 M15 3v3 M20 6v3',
    library: 'M4 4h6v16H4z M13 5l5-1 3 15-5 1z',
    settings: 'M5 3v18 M12 3v18 M19 3v18 M2 8h6 M9 15h6 M16 7h6',
    logout: 'M9 3H3v18h6 M8 12h13 M16 7l5 5-5 5',
    bell: 'M5 16h14l-2-3V9a5 5 0 0 0-10 0v4z M10 20h4',
    plus: 'M12 8v8 M8 12h8 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
    heart: 'M12 21 3 12C-3 4 7 0 12 7c5-7 15-3 9 5z',
    comment: 'M3 4h18v13H9l-6 4z',
    pin: 'M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13z M12 6v6 M9 9h6',
    flag: 'M4 22V3h15l-3 5 3 5H4',
    phone: 'M4 3h4l2 5-3 2c1 3 4 6 7 7l2-3 5 2v4C11 24 0 13 4 3z',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.paw} /></svg>;
}
