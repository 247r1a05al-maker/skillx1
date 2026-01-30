import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    exchangeRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
    },
    userId1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    skill1: String,
    skill2: String,
    scheduledDate: Date,
    scheduledTime: String,
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    coinsRewarded: {
      user1: { type: Number, default: 0 },
      user2: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

export default mongoose.model('Session', sessionSchema)
