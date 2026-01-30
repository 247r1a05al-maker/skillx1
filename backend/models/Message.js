import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: String,
    image: String,
    file: String,
    isEdited: {
      type: Boolean,
      default: false,
    },
    seenBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        seenAt: Date,
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('Message', messageSchema)
