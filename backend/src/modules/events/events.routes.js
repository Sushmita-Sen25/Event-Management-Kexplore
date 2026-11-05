import { Router } from 'express';
import { z } from 'zod';
import { ApiError, parse } from '../../lib/http.js';
import { escapeRegExp } from '../../lib/reference.js';
import { CATEGORIES, Event } from '../../models/event.model.js';

const DAY = 86_400_000;

/** Fields a listing card needs — keeps list responses light. */
export const CARD = 'slug title category summary startsAt endsAt venue price capacity booked featured organizer image tags';

const PRICE_BANDS = {
  free: { price: 0 },
  'under-1000': { price: { $gt: 0, $lt: 1000 } },
  '1000-2500': { price: { $gte: 1000, $lte: 2500 } },
  'over-2500': { price: { $gt: 2500 } },
};

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  // comma-separated list, e.g. ?category=Music,Art
  category: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter((c) => CATEGORIES.includes(c)) : [])),
  city: z.string().trim().max(60).optional(),
  price: z.enum(Object.keys(PRICE_BANDS)).optional().catch(undefined),
  when: z.enum(['upcoming', 'week', 'month', 'quarter', 'past', 'all']).default('upcoming').catch('upcoming'),
  sort: z.enum(['soonest', 'popular', 'price-asc', 'price-desc']).default('soonest').catch('soonest'),
  featured: z.enum(['true']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(200).default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(48).default(12).catch(12),
});

function whereFor({ q, category, city, price, when, featured }) {
  const now = new Date();
  const where = {};
  if (category.length) where.category = { $in: category };
  if (city) where['venue.city'] = city;
  if (price) Object.assign(where, PRICE_BANDS[price]);
  if (featured) where.featured = true;

  const horizon = { week: 7, month: 31, quarter: 92 }[when];
  if (when === 'past') where.endsAt = { $lt: now };
  else if (when !== 'all') where.endsAt = { $gte: now };
  if (horizon) where.startsAt = { $lte: new Date(now.getTime() + horizon * DAY) };

  if (q) {
    const rx = new RegExp(escapeRegExp(q), 'i');
    where.$or = [{ title: rx }, { summary: rx }, { tags: rx }, { organizer: rx }, { 'venue.name': rx }, { 'venue.city': rx }];
  }
  return where;
}

// Lists are the same for every visitor, so let Vercel's edge cache them briefly.
const edgeCache = (res, seconds) => res.set('Cache-Control', `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=900`);

export const eventsRouter = Router();

eventsRouter.get('/', parse(listQuery, 'query'), async (req, res) => {
  const query = req.data.query;
  const where = whereFor(query);
  const order = {
    soonest: query.when === 'past' ? { startsAt: -1 } : { startsAt: 1 },
    popular: { booked: -1 },
    'price-asc': { price: 1, startsAt: 1 },
    'price-desc': { price: -1, startsAt: 1 },
  }[query.sort];

  const [items, total] = await Promise.all([
    Event.find(where).sort(order).skip((query.page - 1) * query.limit).limit(query.limit).select(CARD),
    Event.countDocuments(where),
  ]);
  edgeCache(res, 30);
  res.json({ items, total, page: query.page, pageCount: Math.max(1, Math.ceil(total / query.limit)) });
});

eventsRouter.get('/facets', async (_req, res) => {
  const upcoming = { endsAt: { $gte: new Date() } };
  const [categories, cities, [totals]] = await Promise.all([
    Event.aggregate([{ $match: upcoming }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Event.aggregate([{ $match: upcoming }, { $group: { _id: '$venue.city', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Event.aggregate([
      { $match: upcoming },
      { $group: { _id: null, events: { $sum: 1 }, seatsBooked: { $sum: '$booked' }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
    ]),
  ]);
  edgeCache(res, 60);
  res.json({
    categories: categories.map((c) => ({ name: c._id, count: c.count })),
    cities: cities.map((c) => ({ name: c._id, count: c.count })),
    totals: { events: totals?.events ?? 0, seatsBooked: totals?.seatsBooked ?? 0, cities: cities.length },
  });
});

eventsRouter.get('/:slug', async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) throw new ApiError(404, 'We couldn’t find that event');
  const similar = await Event.find({ _id: { $ne: event._id }, category: event.category, endsAt: { $gte: new Date() } })
    .sort({ startsAt: 1 })
    .limit(3)
    .select(CARD);
  edgeCache(res, 15);
  res.json({ event, similar });
});
