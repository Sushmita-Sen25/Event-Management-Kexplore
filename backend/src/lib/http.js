import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../config.js';

/** An error with an HTTP status and optional per-field messages. */
export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** Parse `req[part]` with a Zod schema; on failure respond 422 with field messages. */
export const parse = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) fields[issue.path.join('.') || 'form'] ??= issue.message;
    throw new ApiError(422, 'Some details need another look', fields);
  }
  req.data = { ...req.data, [part]: result.data };
  next();
};

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export function notFound(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message;
  if (err instanceof mongoose.Error.CastError) [status, message] = [400, 'Invalid identifier'];
  if (err?.code === 11000) [status, message] = [409, 'That already exists'];
  if (err?.type === 'entity.parse.failed') [status, message] = [400, 'Request body is not valid JSON'];
  if (status >= 500) {
    console.error(err);
    if (config.production) message = 'Something went wrong on our side';
  }
  res.status(status).json({ message, ...(err.fields && { fields: err.fields }) });
}
