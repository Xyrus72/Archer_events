export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const bad = (message, details) => new HttpError(400, message, details);
export const notFound = (message = "Not found") => new HttpError(404, message);

/* store docs → API shape: _id becomes id, ObjectIds become strings, Dates stay ISO via JSON */
export function serialize(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  for (const k of Object.keys(rest)) {
    const v = rest[k];
    if (v && typeof v === "object" && v._bsontype === "ObjectId") rest[k] = String(v);
  }
  return { id: String(_id), ...rest };
}
