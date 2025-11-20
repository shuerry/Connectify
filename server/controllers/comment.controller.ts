import express, { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import {
  AddCommentRequest,
  FakeSOSocket,
  PopulatedDatabaseQuestion,
  PopulatedDatabaseAnswer,
} from '../types/types';
import { addComment, saveComment, deleteOrHideComment } from '../services/comment.service';
import { populateDocument } from '../utils/database.util';

const commentController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Handles adding a new comment to the specified question or answer. The comment is first validated and then saved.
   * If the comment is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddCommentRequest object containing the comment data.
   * @param res The HTTP response object used to send back the result of the operation.
   * @param type The type of the comment, either 'question' or 'answer'.
   *
   * @returns A Promise that resolves to void.
   */
  
  const addCommentRoute = async (req: AddCommentRequest, res: Response): Promise<void> => {
    const id = req.body.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).send('Invalid ID format');
      return;
    }

    const { comment, type } = req.body;

    try {
      const comFromDb = await saveComment(comment);

      if ('error' in comFromDb) {
        throw new Error(comFromDb.error);
      }

      const status = await addComment(id, type, comFromDb);

      if (status && 'error' in status) {
        throw new Error(status.error);
      }

      // Populates the fields of the question or answer that this comment
      // was added to, and emits the updated object
      const populatedDoc = await populateDocument(id, type);

      if (populatedDoc && 'error' in populatedDoc) {
        throw new Error(populatedDoc.error);
      }

      socket.emit('commentUpdate', {
        result: populatedDoc as PopulatedDatabaseQuestion | PopulatedDatabaseAnswer,
        type,
      });
      res.json(comFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding comment: ${(err as Error).message}`);
    }
  };

  router.post('/addComment', addCommentRoute);

  /**
   * Deletes a comment or hides it if the requester is the owner of the question.
   * Expects `username` in the request body.
   */
  const deleteCommentRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params as { commentId: string };
      const { username } = req.body as { username?: string };

      if (!commentId) {
        res.status(400).send('commentId is required');
        return;
      }

      if (!username) {
        res.status(400).send('Username is required');
        return;
      }

      const result = await deleteOrHideComment(commentId, username);

      if ('error' in result) {
        if (result.error === 'Comment not found') {
          res.status(404).send(result.error);
        } else if (typeof result.error === 'string' && result.error.includes('Unauthorized')) {
          res.status(403).send(result.error);
        } else {
          res.status(400).send(result.error);
        }
        return;
      }

      // Notify clients that a comment was updated/removed
      socket.emit('commentUpdate', {
        result: ('updatedDoc' in result ? result.updatedDoc : result) as
          | PopulatedDatabaseQuestion
          | PopulatedDatabaseAnswer, // fallback to result if updatedDoc does not exist
        type:
          'type' in result && (result.type === 'question' || result.type === 'answer')
            ? result.type
            : 'question', // fallback to 'question' if type does not exist or is invalid
      });
      res.json({ message: result.msg });
    } catch (err: unknown) {
      res.status(500).send(`Error when deleting/hiding comment: ${(err as Error).message}`);
    }
  };

  router.delete('/deleteComment/:commentId', deleteCommentRoute);

  return router;
};

export default commentController;
