import { Schema } from 'mongoose';
/**
 * Mongoose schema for the QuestionVersion collection.
 *
 * This schema defines the structure for storing previous versions of questions.
 * Each version includes the following fields:
 * - `questionId`: Reference to the original question.
 * - `title`: The title of the question at this version.
 * - `text`: The detailed content of the question at this version.
 * - `tags`: An array of references to `Tag` documents associated with this version.
 * - `versionNumber`: The version number (1-based, where 1 is the oldest).
 * - `createdAt`: The date and time when this version was created.
 * - `createdBy`: The username of the user who created this version (usually the question author).
 */
const questionVersionSchema: Schema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    versionNumber: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { collection: 'QuestionVersion' },
);

// Compound index to ensure unique version numbers per question
questionVersionSchema.index({ questionId: 1, versionNumber: 1 }, { unique: true });

export default questionVersionSchema;

