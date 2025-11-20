import {
  AnswerResponse,
  Comment,
  CommentResponse,
  DatabaseAnswer,
  DatabaseComment,
  DatabaseQuestion,
  QuestionResponse,
} from '../types/types';
import AnswerModel from '../models/answers.model';
import QuestionModel from '../models/questions.model';
import CommentModel from '../models/comments.model';

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

/**
 * Delete a comment by id.
 * - If the requester is the comment author, the comment is removed and references
 *   are pulled from the parent (question or answer).
 * - If the requester is the owner of the question which contains the comment,
 *   the comment will be hidden instead of deleted (best practice for moderation).
 */
export const deleteOrHideComment = async (
  commentId: string,
  username: string,
): Promise<{ msg?: string } | { error: string }> => {
  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment) return { error: 'Comment not found' };

    // Check parent question first
    const parentQuestion = await QuestionModel.findOne({ comments: comment._id });
    if (parentQuestion) {
      // If requester is the comment author -> delete; if requester is question owner -> hide
      if (comment.commentBy === username) {
        // remove reference and delete comment
        await QuestionModel.findByIdAndUpdate(parentQuestion._id, {
          $pull: { comments: comment._id },
        });
        await CommentModel.findByIdAndDelete(comment._id);
        return { msg: 'Comment deleted' };
      }

      if (parentQuestion.askedBy === username) {
        comment.hidden = true;
        await comment.save();
        return { msg: 'Comment hidden' };
      }

      return { error: 'Unauthorized: cannot delete or hide this comment' };
    }

    // If not on a question, check answers
    const parentAnswer = await AnswerModel.findOne({ comments: comment._id });
    if (parentAnswer) {
      // If requester is the comment author -> delete; otherwise unauthorized
      if (comment.commentBy === username) {
        await AnswerModel.findByIdAndUpdate(parentAnswer._id, { $pull: { comments: comment._id } });
        await CommentModel.findByIdAndDelete(comment._id);
        return { msg: 'Comment deleted' };
      }

      return { error: 'Unauthorized: cannot delete or hide this comment' };
    }

    // If no parent found, allow deletion only by author
    if (comment.commentBy === username) {
      await CommentModel.findByIdAndDelete(comment._id);
      return { msg: 'Comment deleted' };
    }

    return { error: 'Unauthorized or parent not found' };
  } catch (error) {
    return { error: 'Error when deleting/hiding comment' };
  }
};
