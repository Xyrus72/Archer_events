/* Shared event rules. */

export const EVENT_KINDS = ["festival", "concert", "corporate", "wedding", "activation", "themed", "other"];
export const ROLES = ["visitor", "stall"];

/* festivals and melas take stall bookings as well as visitors; everything else is attend-only */
export const rolesFor = (kind) => (kind === "festival" ? ["visitor", "stall"] : ["visitor"]);

/* an event "ends" at endsAt, or 12h after it starts when no end is given */
export const endOf = (e) => (e.endsAt ? e.endsAt.getTime() : e.startsAt.getTime() + 12 * 3600_000);

export const isLive = (e, now = Date.now()) => e.startsAt.getTime() <= now && endOf(e) >= now;
export const isOver = (e, now = Date.now()) => endOf(e) < now;
