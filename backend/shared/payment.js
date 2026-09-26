/* Payment vocabulary shared by the server and both front ends. */

export const METHODS = [
  { id: "bkash", name: "bKash", hint: "Mobile wallet", accent: "#e2136e" },
  { id: "nagad", name: "Nagad", hint: "Mobile wallet", accent: "#ec1c24" },
  { id: "card", name: "Card", hint: "Visa · Mastercard", accent: "#1a1f71" },
];
export const METHOD_IDS = METHODS.map((m) => m.id);
export const METHOD_NAME = Object.fromEntries(METHODS.map((m) => [m.id, m.name]));

export const PAY_STATUS = ["created", "paid", "failed", "cancelled", "refunded"];

/* Taka, written the way Bangladesh writes it */
export const taka = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

/* what a registration owes: the event's price for that role, times the party size */
export function amountFor(event, role, guests = 1) {
  const p = event?.pricing || {};
  if (role === "stall") return Number(p.stall || 0);
  return Number(p.visitor || 0) * Math.max(1, Number(guests) || 1);
}
