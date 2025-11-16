import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { Answer, PopulatedDatabaseAnswer } from './answer';
import { DatabaseTag, Tag } from './tag';
import { Comment, DatabaseComment } from './comment';
import { DatabaseCommunity } from './community';
import { User } from './user';

/**
 * Type representing the possible ordering options for questions.
 * - `newest`: Sort by the most recently asked questions.
 * - `unanswered`: Sort by questions with no answers.
 * - `active`: Sort by questions with recent activity (views, answers, votes).
 * - `mostViewed`: Sort by the most viewed questions.
 * - `trending`: Sort by a composite popularity score emphasizing recent votes and comments.
 */
export type OrderType = 'newest' | 'unanswered' | 'active' | 'mostViewed' | 'trending';

/**
 * Represents a question.
 * - `title`: The title of the question.
 * - `text`: The detailed content of the question.
 * - `tags`: An array of tags associated with the question.
 * - `askedBy`: The username of the user who asked the question.
 * - `askDateTime`: The timestamp when the question was asked.
 * - `answers`: An array of answers related to the question.
 * - `views`: An array of usernames who have viewed the question.
 * - `upVotes`: An array of usernames who have upvoted the question.
 * - `downVotes`: An array of usernames who have downvoted the question.
 * - `comments`: An array of comments related to the question.
 * - `community`: The ObjectId of the community the question belongs to, or `null`.
 * - 'followers': An array of usernames who follow the question.
 */
export interface Question {
  title: string;
  text: string;
  tags: Tag[];
  askedBy: string;
  askDateTime: Date;
  answers: Answer[];
  views: string[];
  upVotes: string[];
  downVotes: string[];
  comments: Comment[];
  community: ObjectId | null;
  followers: User[];
}

/**
 * Represents a question stored in the database.
 * - `_id`: Unique identifier for the question.
 * - `tags`: An array of ObjectIds referencing tags associated with the question.
 * - `answers`: An array of ObjectIds referencing answers associated with the question.
 * - `comments`: An array of ObjectIds referencing comments associated with the question.
 * - `community`: An ObjectId referencing the community the question belongs to, or `null`.
 * - `followers`: An array of ObjectIds referencing users who follow the question.
 */
export interface DatabaseQuestion
  extends Omit<Question, 'tags' | 'answers' | 'comments' | 'community' | 'followers'> {
  _id: ObjectId;
  tags: ObjectId[];
  answers: ObjectId[];
  comments: ObjectId[];
  community: ObjectId | null;
  followers: ObjectId[];
}

/**
 * Represents a fully populated question from the database.
 * - `tags`: An array of populated `DatabaseTag` objects.
 * - `answers`: An array of populated `PopulatedDatabaseAnswer` objects.
 * - `comments`: An array of populated `DatabaseComment` objects.
 * - `community`: A populated `DatabaseCommunity` object or `null`.
 * - `followers`: An array of usernames who follow the question.
 */
export interface PopulatedDatabaseQuestion
  extends Omit<DatabaseQuestion, 'tags' | 'answers' | 'comments' | 'community' | 'followers'> {
  tags: DatabaseTag[];
  answers: PopulatedDatabaseAnswer[];
  comments: DatabaseComment[];
  community: DatabaseCommunity | null;
  followers: User[];
}

/**
 * Type representing possible responses for a Question-related operation.
 * - Either a `DatabaseQuestion` object or an error message.
 */
export type QuestionResponse = DatabaseQuestion | { error: string };

/**
 * Type representing an object with the vote success message, updated upVotes,
 */
export type VoteInterface = { msg: string; upVotes: string[]; downVotes: string[] };

/**
 * Type representing possible responses for a vote-related operation.
 * - Either an object with the vote success message, updated upVotes,
 *   and updated downVotes, or an error message.
 */
export type VoteResponse = VoteInterface | { error: string };

/**
 * Type representing an object with the follower success message and updated followers list.
 */
export type FollowInterface = { msg: string; followers: User[] };

/** Type representing possible responses for a follow-related operation.
 * - Either an object with the follower success message and updated followers list,
 *   or an error message.
 */
export type FollowResponse = FollowInterface | { error: string };

/**
 * Interface for the request query to find questions using a search string.
 * - `order`: The order in which to sort the questions.
 * - `search`: The search string used to find questions.
 * - `askedBy`: The username of the user who asked the question.
 * - `viewer`: The username of the viewer.
 */
export interface FindQuestionRequest extends Request {
  query: {
    order: OrderType;
    search: string;
    askedBy: string;
    viewer?: string;
  };
}

/**
 * Interface for the request when finding a question by its ID.
 * - `qid`: The unique identifier of the question (params).
 * - `username`: The username of the user making the request (body).
 */
export interface FindQuestionByIdRequest extends Request {
  params: {
    qid: string;
  };
  query: {
    username: string;
  };
}

/**
 * Interface for the request body when adding a new question.
 * - `body`: The question being added.
 */
export interface AddQuestionRequest extends Request {
  body: Question;
}

/**
 * Interface for the request body when upvoting or downvoting a question.
 * - `qid`: The unique identifier of the question being voted on (body).
 * - `username`: The username of the user casting the vote (body).
 */
export interface VoteRequest extends Request {
  body: {
    qid: string;
    username: string;
  };
}

/** Interface for the request body when following a question.
 * - `qid`: The unique identifier of the question being followed (body).
 * - `username`: The username of the user who wants to follow the question (body).
 */
export interface FollowRequest extends Request {
  body: {
    qid: string;
    username: string;
  };
}

/**
 * Interface for the request when retrieving community questions.
 * - `communityId`: The unique identifier of the community (params).
 */
export interface CommunityQuestionsRequest extends Request {
  params: {
    communityId: string;
  };
}

/**
 * Interface for the request body when editing an existing question.
 * - qid: The unique identifier of the question being edited (params).
 * - body: The updated question data.
 */
export interface EditQuestionRequest extends Request {
  params: {
    qid: string;
  };
  body: {
    title: string;
    text: string;
    tags: Tag[];
    username: string;
  };
}

/**
 * Type representing possible responses for an update Question operation.
 * - Either a PopulatedDatabaseQuestion object or an error message.
 */
export type UpdateQuestionResponse = PopulatedDatabaseQuestion | { error: string };

/**
 * Represents a version of a question stored in the database.
 * - `_id`: Unique identifier for the version.
 * - `questionId`: Reference to the original question.
 * - `title`: The title of the question at this version.
 * - `text`: The detailed content of the question at this version.
 * - `tags`: An array of ObjectIds referencing tags associated with this version.
 * - `versionNumber`: The version number (1-based, where 1 is the oldest).
 * - `createdAt`: The date and time when this version was created.
 * - `createdBy`: The username of the user who created this version.
 */
export interface DatabaseQuestionVersion {
  _id: ObjectId;
  questionId: ObjectId;
  title: string;
  text: string;
  tags: ObjectId[];
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
}

/**
 * Represents a fully populated question version from the database.
 * - `tags`: An array of populated `DatabaseTag` objects.
 */
export interface PopulatedDatabaseQuestionVersion extends Omit<DatabaseQuestionVersion, 'tags'> {
  tags: DatabaseTag[];
}

/**
 * Interface for the request when getting version history of a question.
 * - `qid`: The unique identifier of the question (params).
 * - `username`: The username of the user making the request (query).
 */
export interface GetQuestionVersionsRequest extends Request {
  params: {
    qid: string;
  };
  query: {
    username: string;
  };
}

/**
 * Interface for the request when rolling back to a previous version.
 * - `qid`: The unique identifier of the question (params).
 * - `versionId`: The unique identifier of the version to rollback to (params).
 * - `username`: The username of the user making the request (body).
 */
export interface RollbackQuestionRequest extends Request {
  params: {
    qid: string;
    versionId: string;
  };
  body: {
    username: string;
  };
}

/**
 * Type representing possible responses for version-related operations.
 * - Either an array of versions or an error message.
 */
export type QuestionVersionsResponse = PopulatedDatabaseQuestionVersion[] | { error: string };

/**
 * Type representing possible responses for a rollback operation.
 * - Either a PopulatedDatabaseQuestion object or an error message.
 */
export type RollbackQuestionResponse = PopulatedDatabaseQuestion | { error: string };

/**
 * Represents a draft question.
 * - `title`: The title of the draft question.
 * - `text`: The detailed content of the draft question.
 * - `tags`: An array of tags associated with the draft question.
 * - `askedBy`: The username of the user who created the draft.
 * - `community`: The ObjectId of the community the draft belongs to, or `null`.
 * - `createdAt`: The timestamp when the draft was created.
 * - `updatedAt`: The timestamp when the draft was last updated.
 */
export interface Draft {
  title: string;
  text: string;
  tags: Tag[];
  askedBy: string;
  community: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a draft stored in the database.
 * - `_id`: Unique identifier for the draft.
 * - `tags`: An array of ObjectIds referencing tags associated with the draft.
 * - `community`: An ObjectId referencing the community the draft belongs to, or `null`.
 */
export interface DatabaseDraft extends Omit<Draft, 'tags' | 'community'> {
  _id: ObjectId;
  tags: ObjectId[];
  community: ObjectId | null;
}

/**
 * Represents a fully populated draft from the database.
 * - `tags`: An array of populated `DatabaseTag` objects.
 * - `community`: A populated `DatabaseCommunity` object or `null`.
 */
export interface PopulatedDatabaseDraft extends Omit<DatabaseDraft, 'tags' | 'community'> {
  tags: DatabaseTag[];
  community: DatabaseCommunity | null;
}

/**
 * Interface for the request body when saving a new draft.
 * - `body`: The draft being saved.
 */
export interface SaveDraftRequest extends Request {
  body: Draft;
}

/**
 * Interface for the request body when updating an existing draft.
 * - `draftId`: The unique identifier of the draft being updated (params).
 * - `body`: The updated draft data.
 */
export interface UpdateDraftRequest extends Request {
  params: {
    draftId: string;
  };
  body: Draft;
}

/**
 * Interface for the request when getting user drafts.
 * - `username`: The username of the user whose drafts to retrieve (query).
 */
export interface GetUserDraftsRequest extends Request {
  query: {
    username: string;
  };
}

/**
 * Interface for the request when deleting a draft.
 * - `draftId`: The unique identifier of the draft to delete (params).
 * - `username`: The username of the user making the request (body).
 */
export interface DeleteDraftRequest extends Request {
  params: {
    draftId: string;
  };
  body: {
    username: string;
  };
}

/**
 * Interface for the request when publishing a draft as a question.
 * - `draftId`: The unique identifier of the draft to publish (params).
 * - `username`: The username of the user making the request (body).
 */
export interface PublishDraftRequest extends Request {
  params: {
    draftId: string;
  };
  body: {
    username: string;
  };
}

/**
 * Type representing possible responses for draft-related operations.
 * - Either a DatabaseDraft object or an error message.
 */
export type DraftResponse = DatabaseDraft | { error: string };

/**
 * Type representing possible responses for getting user drafts.
 * - Either an array of PopulatedDatabaseDraft objects or an error message.
 */
export type UserDraftsResponse = PopulatedDatabaseDraft[] | { error: string };

/**
 * Type representing possible responses for publishing a draft.
 * - Either a PopulatedDatabaseQuestion object or an error message.
 */
export type PublishDraftResponse = PopulatedDatabaseQuestion | { error: string };
