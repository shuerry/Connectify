import { ObjectId } from 'mongodb';
import { QueryOptions } from 'mongoose';
import {
  DatabaseComment,
  DatabaseCommunity,
  DatabaseQuestion,
  DatabaseTag,
  FollowResponse,
  OrderType,
  PopulatedDatabaseAnswer,
  PopulatedDatabaseQuestion,
  Question,
  QuestionResponse,
  QuestionVersionsResponse,
  RollbackQuestionResponse,
  User,
  VoteResponse,
} from '../types/types';
import AnswerModel from '../models/answers.model';
import QuestionModel from '../models/questions.model';
import QuestionVersionModel from '../models/questionVersions.model';
import TagModel from '../models/tags.model';
import CommentModel from '../models/comments.model';
import { parseKeyword, parseTags } from '../utils/parse.util';
import { getRelations, getUsersWhoBlocked, getUserByUsername } from './user.service';
import UserModel from '../models/users.model';
import { checkTagInQuestion } from './tag.service';
import {
  sortQuestionsByActive,
  sortQuestionsByMostViews,
  sortQuestionsByNewest,
  sortQuestionsByUnanswered,
  sortQuestionsByTrending,
} from '../utils/sort.util';

/**
 * Checks if keywords exist in a question's title or text.
 * @param {Question} q - The question to check
 * @param {string[]} keywordlist - The keywords to check
 * @returns {boolean} - `true` if any keyword is found
 */
const checkKeywordInQuestion = (q: PopulatedDatabaseQuestion, keywordlist: string[]): boolean => {
  for (const w of keywordlist) {
    if (q.title.includes(w) || q.text.includes(w)) {
      return true;
    }
  }
  return false;
};

/**
 * Retrieves questions ordered by specified criteria.
 * @param {OrderType} order - The order type to filter the questions
 * @returns {Promise<Question[]>} - The ordered list of questions
 */
export const getQuestionsByOrder = async (
  order: OrderType,
  viewerUsername?: string,
): Promise<PopulatedDatabaseQuestion[]> => {
  try {
    const qlist: PopulatedDatabaseQuestion[] = await QuestionModel.find().populate<{
      tags: DatabaseTag[];
      answers: PopulatedDatabaseAnswer[];
      comments: DatabaseComment[];
      community: DatabaseCommunity;
      followers: User[];
    }>([
      { path: 'tags', model: TagModel },
      { path: 'answers', model: AnswerModel, populate: { path: 'comments', model: CommentModel } },
      { path: 'comments', model: CommentModel },
      { path: 'followers', model: UserModel, select: 'username email' },
    ]);

    let ordered: PopulatedDatabaseQuestion[];
    switch (order) {
      case 'trending':
        ordered = sortQuestionsByTrending(qlist);
        break;
      case 'active':
        ordered = sortQuestionsByActive(qlist);
        break;
      case 'unanswered':
        ordered = sortQuestionsByUnanswered(qlist);
        break;
      case 'newest':
        ordered = sortQuestionsByNewest(qlist);
        break;
      case 'mostViewed':
      default:
        ordered = sortQuestionsByMostViews(qlist);
        break;
    }

    // If no viewer, return ordered list
    if (!viewerUsername) return ordered;

    // Filter out questions askedBy users blocked by viewer, or askedBy users who blocked viewer
    const viewerRelations = await getRelations(viewerUsername);
    const blockedByViewer = 'error' in viewerRelations ? [] : viewerRelations.blockedUsers;
    const blockedViewerBy = await getUsersWhoBlocked(viewerUsername);
    const blockedViewerByList = Array.isArray(blockedViewerBy) ? blockedViewerBy : [];

    // Hidden questions list
    const viewer = await UserModel.findOne({ username: viewerUsername }).select('hiddenQuestions');
    const hidden = viewer?.hiddenQuestions ?? [];

    return ordered.filter(
      q =>
        !blockedByViewer.includes(q.askedBy) &&
        !blockedViewerByList.includes(q.askedBy) &&
        !hidden.includes(q._id.toString()),
    );
  } catch (error) {
    return [];
  }
};

/**
 * Filters questions by the user who asked them.
 * @param {PopulatedDatabaseQuestion[]} qlist - The list of questions
 * @param {string} askedBy - The username to filter by
 * @returns {PopulatedDatabaseQuestion[]} - Filtered questions
 */
export const filterQuestionsByAskedBy = (
  qlist: PopulatedDatabaseQuestion[],
  askedBy: string,
): PopulatedDatabaseQuestion[] => qlist.filter(q => q.askedBy === askedBy);

/**
 * Filters questions by search string containing tags and/or keywords.
 * @param {PopulatedDatabaseQuestion[]} qlist - The list of questions
 * @param {string} search - The search string
 * @returns {PopulatedDatabaseQuestion[]} - Filtered list of questions
 */
export const filterQuestionsBySearch = (
  qlist: PopulatedDatabaseQuestion[],
  search: string,
): PopulatedDatabaseQuestion[] => {
  const searchTags = parseTags(search);
  const searchKeyword = parseKeyword(search);

  return qlist.filter((question: PopulatedDatabaseQuestion) => {
    if (searchKeyword.length === 0 && searchTags.length === 0) {
      return true;
    }

    if (searchKeyword.length === 0) {
      return checkTagInQuestion(question, searchTags);
    }

    if (searchTags.length === 0) {
      return checkKeywordInQuestion(question, searchKeyword);
    }

    return (
      checkKeywordInQuestion(question, searchKeyword) || checkTagInQuestion(question, searchTags)
    );
  });
};

/**
 * Fetches a question by ID and increments its view count.
 * @param {string} qid - The question ID
 * @param {string} username - The username requesting the question
 * @returns {Promise<QuestionResponse | null>} - The question with incremented views or error message
 */
export const fetchAndIncrementQuestionViewsById = async (
  qid: string,
  username: string,
): Promise<PopulatedDatabaseQuestion | { error: string }> => {
  try {
    const q: PopulatedDatabaseQuestion | null = await QuestionModel.findOneAndUpdate(
      { _id: new ObjectId(qid) },
      { $addToSet: { views: username } },
      { new: true },
    ).populate<{
      tags: DatabaseTag[];
      answers: PopulatedDatabaseAnswer[];
      comments: DatabaseComment[];
      community: DatabaseCommunity;
      followers: User[];
    }>([
      { path: 'tags', model: TagModel },
      { path: 'answers', model: AnswerModel, populate: { path: 'comments', model: CommentModel } },
      { path: 'comments', model: CommentModel },
      { path: 'followers', model: UserModel, select: 'username email' },
    ]);

    if (!q) {
      throw new Error('Question not found');
    }

    // Enforce visibility: if either party blocked the other, hide
    const viewerRelations = await getRelations(username);
    const blockedByViewer = 'error' in viewerRelations ? [] : viewerRelations.blockedUsers;
    const blockedViewerBy = await getUsersWhoBlocked(username);
    const blockedViewerByList = Array.isArray(blockedViewerBy) ? blockedViewerBy : [];

    if (blockedByViewer.includes(q.askedBy) || blockedViewerByList.includes(q.askedBy)) {
      return { error: 'Access denied' };
    }

    // If viewer has hidden this question and is not the author, deny
    const viewer = await UserModel.findOne({ username }).select('hiddenQuestions');
    const hidden = viewer?.hiddenQuestions ?? [];
    if (hidden.includes(q._id.toString()) && q.askedBy !== username) {
      return { error: 'Access denied' };
    }

    return q;
  } catch (error) {
    return { error: 'Error when fetching and updating a question' };
  }
};

/**
 * Saves a new question to the database.
 * @param {Question} question - The question to save
 * @returns {Promise<QuestionResponse>} - The saved question or error message
 */
export const saveQuestion = async (question: Question): Promise<QuestionResponse> => {
  try {
    const result: DatabaseQuestion = await QuestionModel.create(question);

    return result;
  } catch (error) {
    return { error: 'Error when saving a question' };
  }
};

/**
 * Adds a vote to a question.
 * @param {string} qid - The question ID
 * @param {string} username - The username who voted
 * @param {'upvote' | 'downvote'} voteType - The vote type
 * @returns {Promise<VoteResponse>} - The updated vote result
 */
export const addVoteToQuestion = async (
  qid: string,
  username: string,
  voteType: 'upvote' | 'downvote',
): Promise<VoteResponse> => {
  let updateOperation: QueryOptions;

  if (voteType === 'upvote') {
    updateOperation = [
      {
        $set: {
          upVotes: {
            $cond: [
              { $in: [username, '$upVotes'] },
              { $filter: { input: '$upVotes', as: 'u', cond: { $ne: ['$$u', username] } } },
              { $concatArrays: ['$upVotes', [username]] },
            ],
          },
          downVotes: {
            $cond: [
              { $in: [username, '$upVotes'] },
              '$downVotes',
              { $filter: { input: '$downVotes', as: 'd', cond: { $ne: ['$$d', username] } } },
            ],
          },
        },
      },
    ];
  } else {
    updateOperation = [
      {
        $set: {
          downVotes: {
            $cond: [
              { $in: [username, '$downVotes'] },
              { $filter: { input: '$downVotes', as: 'd', cond: { $ne: ['$$d', username] } } },
              { $concatArrays: ['$downVotes', [username]] },
            ],
          },
          upVotes: {
            $cond: [
              { $in: [username, '$downVotes'] },
              '$upVotes',
              { $filter: { input: '$upVotes', as: 'u', cond: { $ne: ['$$u', username] } } },
            ],
          },
        },
      },
    ];
  }

  try {
    const result: DatabaseQuestion | null = await QuestionModel.findOneAndUpdate(
      { _id: qid },
      updateOperation,
      { new: true },
    );

    if (!result) {
      return { error: 'Question not found!' };
    }

    let msg = '';

    if (voteType === 'upvote') {
      msg = result.upVotes.includes(username)
        ? 'Question upvoted successfully'
        : 'Upvote cancelled successfully';
    } else {
      msg = result.downVotes.includes(username)
        ? 'Question downvoted successfully'
        : 'Downvote cancelled successfully';
    }

    return {
      msg,
      upVotes: result.upVotes || [],
      downVotes: result.downVotes || [],
    };
  } catch (err) {
    return {
      error:
        voteType === 'upvote'
          ? 'Error when adding upvote to question'
          : 'Error when adding downvote to question',
    };
  }
};

/**
 * Updates an existing question in the database.
 * @param {string} qid  The question ID to update
 * @param {string} title  The updated title
 * @param {string} text  The updated text content
 * @param {DatabaseTag[]} processedTags  The processed tags for the question
 * @param {string} username  The username of the person attempting to edit
 * @returns {Promise<UpdateQuestionResponse>}  The updated question or error message
 */
export const updateQuestion = async (
  qid: string,
  title: string,
  text: string,
  processedTags: DatabaseTag[],
  username: string,
): Promise<PopulatedDatabaseQuestion | { error: string }> => {
  try {
    // First, check if the question exists and if the user is authorized to edit it
    const existingQuestion = await QuestionModel.findById(qid);

    if (!existingQuestion) {
      return { error: 'Question not found' };
    }

    // Check if the user is the author of the question
    if (existingQuestion.askedBy !== username) {
      return { error: 'Unauthorized: You can only edit your own questions' };
    }

    // Validate input
    if (!title.trim() || !text.trim()) {
      return { error: 'Title and text cannot be empty' };
    }

    if (title.trim().length > 100) {
      return { error: 'Title must be 100 characters or less' };
    }

    if (processedTags.length === 0) {
      return { error: 'At least one tag is required' };
    }

    if (processedTags.length > 5) {
      return { error: 'Maximum 5 tags allowed' };
    }

    // Save the current version before updating
    // Get the current version number (count existing versions + 1)
    const existingVersionsCount = await QuestionVersionModel.countDocuments({
      questionId: new ObjectId(qid),
    });

    // Create a version snapshot of the current question state
    await QuestionVersionModel.create({
      questionId: new ObjectId(qid),
      title: existingQuestion.title,
      text: existingQuestion.text,
      tags: existingQuestion.tags,
      versionNumber: existingVersionsCount + 1,
      createdBy: username,
      createdAt: new Date(),
    });

    // Update the question
    const updatedQuestion = await QuestionModel.findByIdAndUpdate(
      qid,
      {
        title: title.trim(),
        text: text.trim(),
        tags: processedTags.map(tag => tag._id),
      },
      { new: true },
    ).populate<{
      tags: DatabaseTag[];
      answers: PopulatedDatabaseAnswer[];
      comments: DatabaseComment[];
      community: DatabaseCommunity;
      followers: User[];
    }>([
      { path: 'tags', model: TagModel },
      { path: 'answers', model: AnswerModel, populate: { path: 'comments', model: CommentModel } },
      { path: 'comments', model: CommentModel },
      { path: 'followers', model: UserModel, select: 'username email' },
    ]);

    if (!updatedQuestion) {
      return { error: 'Failed to update question' };
    }

    return updatedQuestion;
  } catch (error) {
    return { error: 'Error when updating question' };
  }
};

/**
 * Fetches all questions in a community.
 *
 * @param communityId - The ID of the community to fetch questions from
 * @returns {Promise<DatabaseQuestion[]>} - The list of questions in the community
 */
export const getCommunityQuestions = async (communityId: string): Promise<DatabaseQuestion[]> => {
  try {
    const questions = await QuestionModel.find({ community: communityId });

    return questions;
  } catch (error) {
    return [];
  }
};

/**
 * Adds a follower to a question.
 *
 * @param qid - The ID of the question to follow
 * @param username - The username of the user who wants to follow the question
 * @returns {Promise<FollowResponse>} - The success message or error message
 */
export const addFollowerToQuestion = async (
  qid: string,
  username: string,
): Promise<FollowResponse> => {
  try {
    const followerUser = await getUserByUsername(username);
    if (!followerUser || 'error' in followerUser) {
      return { error: 'User not found' };
    }

    const followerId = followerUser._id;

    const question = await QuestionModel.findById(qid);
    const alreadyFollowed = question?.followers.includes(followerId);

    //console.log('Already followed:', alreadyFollowed);

    const result = await QuestionModel.findOneAndUpdate(
      { _id: qid },
      alreadyFollowed
        ? { $pull: { followers: followerId } }
        : { $addToSet: { followers: followerId } },
      { new: true },
    ).populate('followers', 'username email emailVerified');

    if (!result) {
      return { error: 'Error adding follower!' };
    }

    return {
      msg: alreadyFollowed ? 'Question unfollowed successfully' : 'Question followed successfully',
      followers: (result.followers || []) as unknown as User[],
    };
  } catch (err) {
    return {
      error: 'Error when following question',
    };
  }
};

/**
 * Gets the version history for a question.
 * Only the question author can view version history.
 *
 * @param qid - The ID of the question
 * @param username - The username of the user requesting the history
 * @returns {Promise<QuestionVersionsResponse>} - The list of versions or an error message
 */
export const getQuestionVersions = async (
  qid: string,
  username: string,
): Promise<QuestionVersionsResponse> => {
  try {
    // Check if the question exists and if the user is authorized
    const question = await QuestionModel.findById(qid);

    if (!question) {
      return { error: 'Question not found' };
    }

    // Check if the user is the question author
    if (question.askedBy !== username) {
      return { error: 'Unauthorized: Only the question author can view version history' };
    }

    // Get all versions for this question, ordered by version number (oldest first)
    const versions = await QuestionVersionModel.find({ questionId: new ObjectId(qid) })
      .sort({ versionNumber: 1 })
      .populate<{ tags: DatabaseTag[] }>([{ path: 'tags', model: TagModel }]);

    return versions;
  } catch (error) {
    return { error: 'Error when fetching question versions' };
  }
};

/**
 * Rolls back a question to a previous version.
 * Only the question author can rollback.
 *
 * @param qid - The ID of the question
 * @param versionId - The ID of the version to rollback to
 * @param username - The username of the user attempting the rollback
 * @returns {Promise<RollbackQuestionResponse>} - The updated question or an error message
 */
export const rollbackQuestion = async (
  qid: string,
  versionId: string,
  username: string,
): Promise<RollbackQuestionResponse> => {
  try {
    // Check if the question exists and if the user is authorized
    const question = await QuestionModel.findById(qid);

    if (!question) {
      return { error: 'Question not found' };
    }

    // Check if the user is the author of the question
    if (question.askedBy !== username) {
      return { error: 'Unauthorized: You can only rollback your own questions' };
    }

    // Get the version to rollback to
    const version = await QuestionVersionModel.findById(versionId).populate<{
      tags: DatabaseTag[];
    }>([{ path: 'tags', model: TagModel }]);

    if (!version) {
      return { error: 'Version not found' };
    }

    // Verify the version belongs to this question
    if (version.questionId.toString() !== qid) {
      return { error: 'Version does not belong to this question' };
    }

    // Save current state as a new version before rollback
    const existingVersionsCount = await QuestionVersionModel.countDocuments({
      questionId: new ObjectId(qid),
    });

    await QuestionVersionModel.create({
      questionId: new ObjectId(qid),
      title: question.title,
      text: question.text,
      tags: question.tags,
      versionNumber: existingVersionsCount + 1,
      createdBy: username,
      createdAt: new Date(),
    });

    // Rollback the question to the selected version
    const rolledBackQuestion = await QuestionModel.findByIdAndUpdate(
      qid,
      {
        title: version.title,
        text: version.text,
        tags: version.tags.map(tag => (typeof tag === 'object' && tag._id ? tag._id : tag)),
      },
      { new: true },
    ).populate<{
      tags: DatabaseTag[];
      answers: PopulatedDatabaseAnswer[];
      comments: DatabaseComment[];
      community: DatabaseCommunity;
      followers: User[];
    }>([
      { path: 'tags', model: TagModel },
      { path: 'answers', model: AnswerModel, populate: { path: 'comments', model: CommentModel } },
      { path: 'comments', model: CommentModel },
      { path: 'followers', model: UserModel, select: 'username email' },
    ]);

    if (!rolledBackQuestion) {
      return { error: 'Failed to rollback question' };
    }

    return rolledBackQuestion;
  } catch (error) {
    return { error: 'Error when rolling back question' };
  }
};

/**
 * Saves a draft for a user
 */
export const saveDraft = async (
  title: string,
  text: string,
  tags: ObjectId[],
  askedBy: string,
  community?: ObjectId | null,
): Promise<{ msg: string } | { error: string }> => {
  try {
    const Draft = (await import('../models/drafts.model')).default;
    
    const newDraft = new Draft({
      title,
      text,
      tags,
      askedBy,
      community,
    });

    const savedDraft = await newDraft.save();
    if (!savedDraft) {
      return { error: 'Failed to save draft' };
    }

    return { msg: 'Draft saved successfully' };
  } catch (error) {
    return { error: 'Error when saving draft' };
  }
};

/**
 * Updates an existing draft
 */
export const updateDraft = async (
  draftId: string,
  title: string,
  text: string,
  tags: ObjectId[],
  askedBy: string,
  community?: ObjectId | null,
): Promise<{ msg: string } | { error: string }> => {
  try {
    const Draft = (await import('../models/drafts.model')).default;
    
    const updatedDraft = await Draft.findOneAndUpdate(
      { _id: draftId, askedBy },
      { title, text, tags, community },
      { new: true },
    );

    if (!updatedDraft) {
      return { error: 'Draft not found or unauthorized' };
    }

    return { msg: 'Draft updated successfully' };
  } catch (error) {
    return { error: 'Error when updating draft' };
  }
};

/**
 * Retrieves all drafts for a user
 */
export const getUserDrafts = async (username: string) => {
  try {
    const Draft = (await import('../models/drafts.model')).default;
    
    const drafts = await Draft.find({ askedBy: username })
      .populate('tags')
      .populate('community')
      .sort({ updatedAt: -1 });

    return drafts;
  } catch (error) {
    return { error: 'Error when retrieving drafts' };
  }
};

/**
 * Deletes a draft
 */
export const deleteDraft = async (
  draftId: string,
  username: string,
): Promise<{ msg: string } | { error: string }> => {
  try {
    const Draft = (await import('../models/drafts.model')).default;
    
    const deletedDraft = await Draft.findOneAndDelete({ _id: draftId, askedBy: username });

    if (!deletedDraft) {
      return { error: 'Draft not found or unauthorized' };
    }

    return { msg: 'Draft deleted successfully' };
  } catch (error) {
    return { error: 'Error when deleting draft' };
  }
};

/**
 * Publishes a draft as a question
 */
export const publishDraft = async (
  draftId: string,
  username: string,
): Promise<QuestionResponse> => {
  try {
    const Draft = (await import('../models/drafts.model')).default;
    
    const draft = await Draft.findOne({ _id: draftId, askedBy: username })
      .populate('tags')
      .populate('community');

    if (!draft) {
      return { error: 'Draft not found or unauthorized' };
    }

    // Create a new question from the draft
    const question: Question = {
      title: draft.title,
      text: draft.text,
      tags: draft.tags.map((tag: any) => ({ name: tag.name, description: tag.description })),
      askedBy: username,
      askDateTime: new Date(),
      answers: [],
      views: [],
      upVotes: [],
      downVotes: [],
      comments: [],
      community: draft.community?._id || null,
      followers: [],
    };
    
    const questionResult = await saveQuestion(question);

    if ('error' in questionResult) {
      return questionResult;
    }

    // Delete the draft after successful publication
    await Draft.findByIdAndDelete(draftId);

    return questionResult;
  } catch (error) {
    return { error: 'Error when publishing draft' };
  }
};
