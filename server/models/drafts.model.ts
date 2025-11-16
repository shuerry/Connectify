import { Schema, model } from 'mongoose';

/**
 * Schema for the drafts collection.
 */
const draftSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    text: {
      type: String,
      required: false,
      maxlength: 5000,
      default: '',
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: false,
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
  },
);

const draft = model('Draft', draftSchema);

export default draft;
