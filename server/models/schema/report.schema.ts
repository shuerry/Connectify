import { Schema } from 'mongoose';

const reportSchema: Schema = new Schema(
  {
    qid: { type: String, required: true },
    reporter: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'Report' },
);

export default reportSchema;


