const paths = {
  sheet: 'M5 3h9l5 5v13H5z M14 3v6h5 M8.5 13h7 M8.5 17h5',
  csv: 'M4 4h16v16H4z M4 9h16 M4 14h16 M10 9v11',
  excel: 'M4 4h16v16H4z M8 16v-3 M12 16V8 M16 16v-6',
  txt: 'M6 3h9l4 4v14H6z M9 10h7 M9 13h7 M9 16h5',
  pdf: 'M5 3h9l5 5v13H5z M14 3v6h5 M8 16c3-2 4-7 3-6-1 2 1 7 4 6-2-2-5-1-7 1',
  upload: 'M12 16V4 M7.5 8.5 12 4l4.5 4.5 M4 15v5h16v-5',
  workspace: 'M3 5h18v14H3z M9 5v14',
  layers: 'm3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5',
  chat: 'M4 4h16v12H9l-5 4z M8 9h8 M8 12h5',
  search: 'M15.5 15.5 21 21 M17 10a7 7 0 1 1-14 0 7 7 0 1 1 14 0',
  book: 'M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1z M12 6v14',
  play: 'm9 5 10 7-10 7z',
  close: 'm6 6 12 12 M18 6 6 18',
  plus: 'M12 5v14 M5 12h14',
  download: 'M12 3v12 M8 11l4 4 4-4 M4 16v4h16v-4',
  clear: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  copy: 'M8 8h12v13H8z M16 8V3H3v13h5',
  check: 'm4 12 5 5L20 6',
  send: 'm3 10 18-7-7 18-3-8z M11 13l10-10',
  stop: 'M6 6h12v12H6z',
  folder: 'M3 6h7l2 2h9v11H3z',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0 M12 11v5 M12 8h.01',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M19 5l-1.5 1.5 M6.5 17.5 5 19',
  moon: 'M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5 9 9 0 1 0 20.5 14.2z',
}

export function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
