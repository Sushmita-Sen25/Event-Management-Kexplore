import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { parse } from '../../lib/http.js';
import { CATEGORIES } from '../../models/event.model.js';
import { Subscriber } from '../../models/subscriber.model.js';

export const newsletterRouter = Router();

newsletterRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, validate: false }),
  parse(
    z.object({
      email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
      interests: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length).default([]),
    }),
  ),
  async (req, res) => {
    const { email, interests } = req.data.body;
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      existing.interests = [...new Set([...existing.interests, ...interests])];
      await existing.save();
      return res.json({ ok: true, alreadySubscribed: true });
    }
    await Subscriber.create({ email, interests });
    res.status(201).json({ ok: true, alreadySubscribed: false });
  },
);
