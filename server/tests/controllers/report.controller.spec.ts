import supertest from 'supertest';
import { app } from '../../app';
import * as reportService from '../../services/report.service';

describe('report.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/report', () => {
    test('creates a report and returns 200', async () => {
      const body = { qid: 'q1', reporter: 'alice', reason: 'spam' };
      jest
        .spyOn(reportService, 'createReport')
        .mockResolvedValue({ _id: 'r1', ...body, createdAt: new Date() } as any);

      const res = await supertest(app).post('/api/report').send(body);
      expect(res.status).toBe(200);
      expect(reportService.createReport).toHaveBeenCalledWith(body);
      expect(res.body._id).toBeDefined();
    });

    test('validates body and returns 400 when missing fields', async () => {
      const res = await supertest(app).post('/api/report').send({ qid: 'q1' });
      expect(res.status).toBe(400);
    });

    test('returns 500 on service error', async () => {
      const body = { qid: 'q1', reporter: 'user1', reason: 'bad content' };
      jest.spyOn(reportService, 'createReport').mockResolvedValue({ error: 'error message' });
      const res = await supertest(app).post('/api/report').send(body);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/report/question/:qid', () => {
    test('returns list of reports', async () => {
      const qid = 'q1';
      const reports = [
        { _id: 'r1', qid, reporter: 'user2', reason: 'offensive', createdAt: new Date() },
      ];
      jest.spyOn(reportService, 'getReportsForQuestion').mockResolvedValue(reports as any);

      const res = await supertest(app).get(`/api/report/question/${qid}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].reason).toBe('offensive');
    });

    test('returns 500 on service error', async () => {
      const qid = 'q1';
      jest
        .spyOn(reportService, 'getReportsForQuestion')
        .mockResolvedValue({ error: 'error message' });
      const res = await supertest(app).get(`/api/report/question/${qid}`);
      expect(res.status).toBe(500);
    });
  });
});
