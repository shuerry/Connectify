import mongoose, { Model } from 'mongoose';
import reportSchema from './schema/report.schema';

export interface DatabaseReport {
  _id: mongoose.Types.ObjectId;
  qid: string;
  reporter: string;
  reason: string;
  createdAt: Date;
}

const ReportModel: Model<DatabaseReport> = mongoose.model<DatabaseReport>('Report', reportSchema);

export default ReportModel;
