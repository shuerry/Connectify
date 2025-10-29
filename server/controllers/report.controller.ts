import express, { Response } from 'express';
import { Request } from 'express';
import { createReport, getReportsForQuestion } from '../services/report.service';

const reportController = () => {
  const router = express.Router();

  router.post('/', async (req: Request, res: Response) => {
    const { qid, reporter, reason } = req.body as {
      qid: string;
      reporter: string;
      reason: string;
    };

    if (!qid || !reporter || !reason) {
      res.status(400).send('Missing fields');
      return;
    }

    const result = await createReport({ qid, reporter, reason });
    if ('error' in result) {
      res.status(500).send(result.error);
      return;
    }
    res.json(result);
  });

  router.get('/question/:qid', async (req: Request, res: Response) => {
    const { qid } = req.params as { qid: string };
    const result = await getReportsForQuestion(qid);
    if (Array.isArray(result)) {
      res.json(result);
    } else {
      res.status(500).send(result.error);
    }
  });

  return router;
};

export default reportController;


