import { Schema, model, Document, Types } from 'mongoose';

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

// Export DraftDocument type for TypeScript usage elsewhere
export type DraftDocument = Document & {
  title: string;
  text?: string;
  tags?: Types.ObjectId[];
  askedBy: string;
  community?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export default draft;
