import mongoose from 'mongoose'

const coinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['earn', 'spend'],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    relatedId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
)

const coinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema)
export default mongoose.model('Coin', coinSchema)
