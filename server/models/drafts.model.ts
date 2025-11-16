import { Schema, model } from 'mongoose';

/**
 * Schema for the drafts collection.
 */
const DraftSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 50,
    },
    text: {
      type: String,
      required: true,
      maxlength: 140,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: true,
      },
    ],
    askedBy: {
      type: String,
      required: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Draft = model('Draft', DraftSchema);

export default Draft;