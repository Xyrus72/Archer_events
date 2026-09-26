/* Inline 16px stroke icons for the ticket office. One place, no icon library. */
const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
const I = (paths) => (props) => (
  <svg {...base} {...props} aria-hidden="true">
    {paths}
  </svg>
);

export const IconHome = I(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const IconCalendar = I(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
export const IconClock = I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconGlobe = I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const IconUsers = I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2" /></>);
export const IconTicket = I(<><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-6Z" /><path d="M13 5v14" strokeDasharray="2 2" /></>);
export const IconStore = I(<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8M10 20v-5h4v5" /></>);
export const IconTrend = I(<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>);
export const IconBell = I(<><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" /><path d="M10 21h4" /></>);
export const IconCheck = I(<path d="M5 12.5 10 17 19 7" />);
export const IconPercent = I(<><path d="M5 19 19 5" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>);
export const IconMenu = I(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconX = I(<path d="M6 6l12 12M18 6 6 18" />);
export const IconSun = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const IconMoon = I(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
export const IconLogout = I(<><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4M18 12H9" /></>);
export const IconExternal = I(<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 13v7H4V6h7" /></>);
export const IconPlus = I(<path d="M12 5v14M5 12h14" />);
export const IconSearch = I(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const IconDownload = I(<><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>);
export const IconUp = I(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconDown = I(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconArrowUp = I(<path d="M12 19V5M6 11l6-6 6 6" />);

export const IconImage = I(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m21 16-5-5-6 6-3-3-4 4" /></>);
