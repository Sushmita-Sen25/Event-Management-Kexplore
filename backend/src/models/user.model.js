import mongoose from 'mongoose';
import { toClient } from './event.model.js';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    picture: String,
    lastSignInAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      ...toClient,
      transform(doc, ret) {
        toClient.transform(doc, ret);
        delete ret.googleId;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
