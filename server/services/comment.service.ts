import {
  AnswerResponse,
  Comment,
  CommentResponse,
  DatabaseAnswer,
  DatabaseComment,
  DatabaseQuestion,
  QuestionResponse,
} from '../types/types';
import QuestionModel from '../models/questions.model';
import CommentModel from '../models/comments.model';
import AnswerModel from '../models/answers.model';

/**
 * Deletes a comment if the requester is authorized.
 * Authorization rules:
 * - The comment author may delete their own comment.
 * - The question author may delete comments on their question.
 * - The answer author may delete comments on their answer.
 */
export const deleteComment = async (
  cid: string,
  username: string,
): Promise<{ msg: string; parentId?: string } | { error: string }> => {
  try {
    const comment = await CommentModel.findById(cid);

    if (!comment) return { error: 'Comment not found' };

    const commentOwner = comment.commentBy;

    // Check if this comment is directly on a question
    const questionWithComment = await QuestionModel.findOne({ comments: cid });
    if (questionWithComment) {
      if (commentOwner === username || questionWithComment.askedBy === username) {
        // authorized
        await CommentModel.findByIdAndDelete(cid);
        await QuestionModel.findByIdAndUpdate(questionWithComment._id, { $pull: { comments: cid } });
        return { msg: 'Comment deleted successfully', parentId: questionWithComment._id.toString() };
      }
      return { error: 'Unauthorized: Cannot delete this comment' };
    }

    // Otherwise, check if comment is on an answer
    const answerWithComment = await AnswerModel.findOne({ comments: cid });
    if (answerWithComment) {
      // Find parent question to allow its author to delete as well
      const parentQuestion = await QuestionModel.findOne({ answers: answerWithComment._id });

      if (
        commentOwner === username ||
        answerWithComment.ansBy === username ||
        parentQuestion?.askedBy === username
      ) {
        await CommentModel.findByIdAndDelete(cid);
        await AnswerModel.findByIdAndUpdate(answerWithComment._id, { $pull: { comments: cid } });
        return { msg: 'Comment deleted successfully', parentId: answerWithComment._id.toString() };
      }

      return { error: 'Unauthorized: Cannot delete this comment' };
    }

    return { error: 'Comment parent not found' };
  } catch (err) {
    return { error: 'Error when deleting comment' };
  }
};

/**
 * Saves a new comment to the database.
 * @param {Comment} comment - The comment to save.
 * @returns {Promise<CommentResponse>} - The saved comment or an error message.
 */
export const saveComment = async (comment: Comment): Promise<CommentResponse> => {
  try {
    const result: DatabaseComment = await CommentModel.create(comment);
    return result;
  } catch (error) {
    return { error: 'Error when saving a comment' };
  }
};

/**
 * Adds a comment to a question or answer.
 * @param {string} id - The ID of the question or answer.
 * @param {'question' | 'answer'} type - The type of the item to comment on.
 * @param {DatabaseComment} comment - The comment to add.
 * @returns {Promise<QuestionResponse | AnswerResponse>} - The updated item or an error message.
 */
export const addComment = async (
  id: string,
  type: 'question' | 'answer',
  comment: DatabaseComment,
): Promise<QuestionResponse | AnswerResponse> => {
  try {
    if (!comment || !comment.text || !comment.commentBy || !comment.commentDateTime) {
      throw new Error('Invalid comment');
    }

    let result: DatabaseQuestion | DatabaseAnswer | null;

    if (type === 'question') {
      result = await QuestionModel.findOneAndUpdate(
        { _id: id },
        { $push: { comments: { $each: [comment._id] } } },
        { new: true },
      );
    } else {
      result = await AnswerModel.findOneAndUpdate(
        { _id: id },
        { $push: { comments: { $each: [comment._id] } } },
        { new: true },
      );
    }

    if (result === null) {
      throw new Error('Failed to add comment');
    }

    return result;
  } catch (error) {
    return { error: `Error when adding comment: ${(error as Error).message}` };
  }
};
