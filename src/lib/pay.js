import { api } from "./api";

/* Checkout calls. The gateway is swappable server-side; the client only ever
   sees a payment ref, a status and where to send the guest next. */

export const startCheckout = (registrationId, method) =>
  api.post(`/api/pay/registrations/${registrationId}/checkout`, { method });

export const getPayment = (ref) => api.get(`/api/pay/${ref}`).then((d) => d.payment);
export const confirmPayment = (ref, body) => api.post(`/api/pay/${ref}/confirm`, body || {}).then((d) => d.payment);
export const cancelPayment = (ref) => api.post(`/api/pay/${ref}/cancel`, {}).then((d) => d.payment);

export const PAY_LABEL = {
  created: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  refunded: "Refunded",
};
