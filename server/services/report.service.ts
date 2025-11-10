import ReportModel, { DatabaseReport } from '../models/reports.model';
import UserModel from '../models/users.model';

export interface CreateReportInput {
  qid: string;
  reporter: string;
  reason: string;
}

export const createReport = async (
  input: CreateReportInput,
): Promise<DatabaseReport | { error: string }> => {
  try {
    const report = await ReportModel.create(input);
    await UserModel.findOneAndUpdate(
      { username: input.reporter },
      { $addToSet: { hiddenQuestions: input.qid } },
      { new: true },
    );
    return report;
  } catch (error) {
    return { error: 'Error when creating report' };
  }
};

export const getReportsForQuestion = async (
  qid: string,
): Promise<DatabaseReport[] | { error: string }> => {
  try {
    const reports = await ReportModel.find({ qid }).sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    return { error: 'Error when fetching reports' };
  }
};
