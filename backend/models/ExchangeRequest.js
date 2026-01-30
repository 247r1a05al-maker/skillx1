import mongoose from 'mongoose'

const exchangeRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
    skillRequested: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    message: String,
  },
  { timestamps: true }
)

export default mongoose.model('ExchangeRequest', exchangeRequestSchema)
