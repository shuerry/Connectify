// QuestionVersion Document Schema
import mongoose, { Model } from 'mongoose';
import questionVersionSchema from './schema/questionVersion.schema';
import { DatabaseQuestionVersion } from '../types/types';

/**
 * Mongoose model for the `QuestionVersion` collection.
 *
 * This model is created using the `DatabaseQuestionVersion` interface and the `questionVersionSchema`,
 * representing the `QuestionVersion` collection in the MongoDB database, and provides an interface
 * for interacting with the stored question versions.
 *
 * @type {Model<DatabaseQuestionVersion>}
 */
const QuestionVersionModel: Model<DatabaseQuestionVersion> =
  mongoose.model<DatabaseQuestionVersion>('QuestionVersion', questionVersionSchema);

export default QuestionVersionModel;
