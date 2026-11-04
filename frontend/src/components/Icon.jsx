const paths = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-8h6v8"/></>,
  coffee: <><path d="M3 8h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM17 8h1a3 3 0 1 1 0 6h-1M6 2v3M10 2v3M14 2v3M2 23h17"/></>,
  receipt: <><path d="M5 3h14v19l-3-2-4 2-4-2-3 2ZM8 7h8M8 11h8M8 15h5"/></>,
  users: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M19 15a6 6 0 0 1 3 6"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  card: <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
  edit: <><path d="m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5"/></>, trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>, arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  left: <path d="m15 6-6 6 6 6"/>, right: <path d="m9 6 6 6-6 6"/>,
  check: <path d="m5 12 4 4L19 6"/>, alert: <><path d="m12 3 10 18H2ZM12 9v4M12 17h.01"/></>,
  refresh: <><path d="M20 7A9 9 0 1 0 21 15M20 2v5h-5"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/></>,
  money: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6M19 9v6"/></>,
  bean: <><ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(35 12 12)"/><path d="M16 4c-9 4 1 12-8 16"/></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>
};
export default function Icon({ name, size = 20, ...props }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.coffee}</svg>; }
