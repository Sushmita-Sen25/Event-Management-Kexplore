import mongoose from 'mongoose';

export const CATEGORIES = ['Music', 'Technology', 'Workshop', 'Sports', 'Food', 'Art', 'Business'];

const toClient = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};

const eventSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    highlights: [String],
    schedule: [{ _id: false, time: String, title: String }],
    tags: [String],
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: {
      name: { type: String, required: true },
      city: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    price: { type: Number, min: 0, default: 0 },
    capacity: { type: Number, min: 1, required: true },
    booked: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    organizer: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true, toJSON: toClient },
);

eventSchema.virtual('remaining').get(function remaining() {
  return Math.max(0, this.capacity - this.booked);
});

eventSchema.index({ startsAt: 1 });
eventSchema.index({ category: 1, startsAt: 1 });
eventSchema.index({ 'venue.city': 1 });

export const Event = mongoose.model('Event', eventSchema);
export { toClient };
