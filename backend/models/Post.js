import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: String,
    tags: [String],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        author: mongoose.Schema.Types.ObjectId,
        text: String,
        createdAt: Date,
      },
    ],
    shares: Number,
  },
  { timestamps: true }
)

export default mongoose.model('Post', postSchema)
