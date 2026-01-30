import mongoose from 'mongoose'

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    skill: String,
    issueDate: {
      type: Date,
      default: Date.now,
    },
    completedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    certificateUrl: String,
  },
  { timestamps: true }
)

export default mongoose.model('Certificate', certificateSchema)
