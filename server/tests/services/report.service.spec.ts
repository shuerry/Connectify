import ReportModel, { DatabaseReport } from '../../models/reports.model';
import { Query } from 'mongoose';
import UserModel from '../../models/users.model';
import { createReport, getReportsForQuestion } from '../../services/report.service';

jest.mock('../../models/reports.model');
jest.mock('../../models/users.model');

describe('report.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    test('creates a report and adds question to reporter hiddenQuestions', async () => {
      const input = { qid: 'q1', reporter: 'user1', reason: 'spam' };

      jest
        .spyOn(ReportModel, 'create')
        .mockResolvedValue({ _id: 'r1', ...input, createdAt: new Date() } as any);
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValue({ username: 'user1', hiddenQuestions: ['q1'] } as any);

      const result = await createReport(input);

      expect(ReportModel.create).toHaveBeenCalledWith(input);
      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'user1' },
        { $addToSet: { hiddenQuestions: 'q1' } },
        { new: true },
      );
      expect('error' in result).toBe(false);
    });

    test('returns error when model throws', async () => {
      const input = { qid: 'q1', reporter: 'user1', reason: 'spam' };
      jest.spyOn(ReportModel, 'create').mockRejectedValue(new Error('db'));

      const result = await createReport(input);
      expect(result).toEqual({ error: 'Error when creating report' });
    });
  });

  describe('getReportsForQuestion', () => {
    test('returns list of reports', async () => {
      const qid = 'q1';
      const mockReports = [
        { _id: 'r1', qid, reporter: 'user1', reason: 'abuse', createdAt: new Date() },
        { _id: 'r2', qid, reporter: 'user2', reason: 'spam', createdAt: new Date() },
      ];
      jest
        .spyOn(ReportModel, 'find')
        .mockReturnValue({ sort: jest.fn().mockResolvedValue(mockReports) } as unknown as Query<
          DatabaseReport[],
          typeof ReportModel
        >);

      const result = await getReportsForQuestion(qid);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(2);
        expect(result[0].reason).toBe('abuse');
      }
    });

    test('returns error on failure', async () => {
      const qid = 'q1';
      jest.spyOn(ReportModel, 'find').mockImplementation(() => {
        throw new Error('db');
      });

      const result = await getReportsForQuestion(qid);
      expect(result).toEqual({ error: 'Error when fetching reports' });
    });
  });
});
