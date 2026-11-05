import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { config } from '../../config.js';
import { ApiError, parse } from '../../lib/http.js';
import { endSession, startSession } from '../../lib/session.js';
import { Booking } from '../../models/booking.model.js';
import { User } from '../../models/user.model.js';

const google = new OAuth2Client(config.googleClientId);

export const authRouter = Router();

/** Google Identity Services hands the browser a signed ID token ("credential"); we verify it here. */
authRouter.post(
  '/google',
  rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false, validate: false }),
  parse(z.object({ credential: z.string().min(20) })),
  async (req, res) => {
    let profile;
    try {
      const ticket = await google.verifyIdToken({ idToken: req.data.body.credential, audience: config.googleClientId });
      profile = ticket.getPayload();
    } catch {
      throw new ApiError(401, 'Google could not verify this sign-in. Please try again.');
    }
    if (!profile?.email_verified) throw new ApiError(403, 'Your Google email is not verified');

    const user = await User.findOneAndUpdate(
      { googleId: profile.sub },
      { email: profile.email, name: profile.name ?? profile.email, picture: profile.picture, lastSignInAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    // Bookings made with this email before signing in now belong to the account.
    await Booking.updateMany({ 'attendee.email': user.email, user: { $exists: false } }, { user: user._id });

    startSession(res, user);
    res.json({ user });
  },
);

authRouter.get('/session', (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json({ user: req.user ?? null });
});

authRouter.post('/signout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});
