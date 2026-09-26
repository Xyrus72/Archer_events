import { api } from "./api";

/* Ticket-office API: same wrapper, with the admin key from this tab's session. */
export const KEY = "archer.adminKey";
export const auth = () => ({ Authorization: `Bearer ${sessionStorage.getItem(KEY) || ""}` });
export const adm = {
  get: (p) => api.get(`/api/admin${p}`, auth()),
  post: (p, b) => api.post(`/api/admin${p}`, b, auth()),
  patch: (p, b) => api.patch(`/api/admin${p}`, b, auth()),
  put: (p, b) => api.put(`/api/admin${p}`, b, auth()),
  del: (p) => api.del(`/api/admin${p}`, auth()),
};
