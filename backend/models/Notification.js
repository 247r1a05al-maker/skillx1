import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'exchange_request', 'coins', 'group', 'post', 'system'],
      required: true,
    },
    title: String,
    message: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
