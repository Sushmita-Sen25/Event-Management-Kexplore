import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/user.model.js';
import { ApiError } from './http.js';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.production,
  path: '/',
  maxAge: config.session.days * 86_400_000,
});

export function startSession(res, user) {
  const token = jwt.sign({ uid: String(user._id) }, config.sessionSecret, { expiresIn: `${config.session.days}d` });
  res.cookie(config.session.cookie, token, cookieOptions());
}

export function endSession(res) {
  const { maxAge: _ignored, ...options } = cookieOptions();
  res.clearCookie(config.session.cookie, options);
}

/** Loads `req.user` from the session cookie when present. Never blocks the request. */
export async function readSession(req, _res, next) {
  const token = req.cookies?.[config.session.cookie];
  if (token) {
    try {
      const { uid } = jwt.verify(token, config.sessionSecret);
      req.user = await User.findById(uid);
    } catch {
      req.user = null;
    }
  }
  next();
}

export function signedIn(req, _res, next) {
  if (!req.user) throw new ApiError(401, 'Sign in with Google to continue');
  next();
}
