import { ObjectId } from 'mongodb';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import CommentModel from '../../models/comments.model';
import DraftModel from '../../models/drafts.model';
import UserModel from '../../models/users.model';

jest.mock('../../services/user.service', () => ({
  getRelations: jest.fn(),
  getUsersWhoBlocked: jest.fn(),
  getUserByUsername: jest.fn(),
}));

jest.mock('../../models/questionVersions.model', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

import { getUserByUsername } from '../../services/user.service';
const mockedGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>;

import * as questionService from '../../services/question.service';
import QuestionVersionModel from '../../models/questionVersions.model';
const MockedQuestionVersionModel = QuestionVersionModel as jest.Mocked<typeof QuestionVersionModel>;
import * as userService from '../../services/user.service';
import * as sortUtil from '../../utils/sort.util';
import * as parseUtil from '../../utils/parse.util';
import * as tagService from '../../services/tag.service';

const {
  addFollowerToQuestion,
  addVoteToQuestion,
  fetchAndIncrementQuestionViewsById,
  filterQuestionsByAskedBy,
  filterQuestionsBySearch,
  getCommunityQuestions,
  getQuestionsByOrder,
  deleteQuestion,
  getQuestionVersions,
  rollbackQuestion,
  saveQuestion,
  saveDraft,
  updateQuestion,
  updateDraft,
  getUserDrafts,
  deleteDraft,
  publishDraft,
} = questionService;

// Helper to mock Mongoose-style query chains that are awaited
function makeQueryThenable(result: any) {
  const query: any = {};
  // chainable query methods
  query.sort = jest.fn().mockReturnValue(query);
  query.populate = jest.fn().mockReturnValue(query);
  // make it awaitable: await query -> result
  query.then = (resolve: (val: any) => any, reject?: (err: any) => any) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

const makePopulateQuery = (result: any) => ({
  populate: jest.fn().mockResolvedValue(result),
});

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const ANOTHER_OBJECT_ID = '507f1f77bcf86cd799439012';
const THIRD_OBJECT_ID = '507f1f77bcf86cd799439013';

describe('question.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuestionsByOrder', () => {
    it('returns questions ordered by trending when no viewer provided', async () => {
      const qlist = [{ _id: '1' }] as any;
      jest.spyOn(QuestionModel, 'find').mockReturnValue(makePopulateQuery(qlist) as any);
      const sorted = [{ _id: 'sorted' }] as any;
      jest.spyOn(sortUtil, 'sortQuestionsByTrending').mockReturnValueOnce(sorted);

      const res = await getQuestionsByOrder('trending');

      expect(sortUtil.sortQuestionsByTrending).toHaveBeenCalledWith(qlist);
      expect(res).toEqual(sorted);
    });

    it.each([
      ['unanswered', 'sortQuestionsByUnanswered'],
      ['newest', 'sortQuestionsByNewest'],
      ['mostViewed', 'sortQuestionsByMostViews'],
    ])('delegates %s ordering to the matching sorter', async (order, sorterName) => {
      const qlist = [{ _id: order }] as any;
      jest.spyOn(QuestionModel, 'find').mockReturnValue(makePopulateQuery(qlist) as any);
      const sortSpy = jest.spyOn(sortUtil as any, sorterName).mockReturnValueOnce(qlist);

      const res = await getQuestionsByOrder(order as any);

      expect(sortSpy).toHaveBeenCalledWith(qlist);
      expect(res).toEqual(qlist);
    });

    it('filters out blocked and hidden questions for a viewer', async () => {
      const allowed = {
        _id: { toString: () => 'allowed' },
        askedBy: 'friend',
        followers: [],
      } as any;
      const blockedByViewer = {
        _id: { toString: () => 'blockedByViewer' },
        askedBy: 'blockedUser',
        followers: [],
      } as any;
      const blockedViewerBy = {
        _id: { toString: () => 'blockedViewerBy' },
        askedBy: 'blocksViewer',
        followers: [],
      } as any;
      const hidden = {
        _id: { toString: () => 'hiddenId' },
        askedBy: 'stranger',
        followers: [],
      } as any;
      const hiddenButAuthored = {
        _id: { toString: () => 'selfHidden' },
        askedBy: 'viewer',
        followers: [],
      } as any;
      const qlist = [allowed, blockedByViewer, blockedViewerBy, hidden, hiddenButAuthored];

      jest.spyOn(QuestionModel, 'find').mockReturnValue(makePopulateQuery(qlist) as any);
      jest.spyOn(sortUtil, 'sortQuestionsByActive').mockReturnValueOnce(qlist);
      jest.spyOn(userService, 'getRelations').mockResolvedValueOnce({
        blockedUsers: ['blockedUser'],
      } as any);
      jest.spyOn(userService, 'getUsersWhoBlocked').mockResolvedValueOnce(['blocksViewer'] as any);
      const select = jest.fn().mockResolvedValue({ hiddenQuestions: ['hiddenId', 'selfHidden'] });
      jest.spyOn(UserModel, 'findOne').mockReturnValue({ select } as any);

      const res = await getQuestionsByOrder('active', 'viewer');

      expect(res).toEqual([allowed]);
    });

    it('returns empty array when the query fails', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('db failure')),
      } as any);

      const res = await getQuestionsByOrder('mostViewed');

      expect(res).toEqual([]);
    });
  });

  describe('filterQuestionsByAskedBy', () => {
    it('filters the provided list by author username', () => {
      const list = [{ askedBy: 'alice' }, { askedBy: 'bob' }, { askedBy: 'alice' }] as any[];

      const res = filterQuestionsByAskedBy(list, 'alice');

      expect(res).toEqual([list[0], list[2]]);
    });
  });

  describe('filterQuestionsBySearch', () => {
    const makeQuestions = () =>
      [
        {
          title: 'Keyword match',
          text: 'Body',
          tags: [{ name: 'tag1' }],
        },
        {
          title: 'Other',
          text: 'No match',
          tags: [{ name: 'tag2' }],
        },
      ] as any[];

    it('returns entire list when no tags or keywords parsed', () => {
      const tagsSpy = jest.spyOn(parseUtil, 'parseTags').mockReturnValue([]);
      const keywordSpy = jest.spyOn(parseUtil, 'parseKeyword').mockReturnValue([]);
      const questions = makeQuestions();

      const res = filterQuestionsBySearch(questions, '   ');

      expect(res).toEqual(questions);

      tagsSpy.mockRestore();
      keywordSpy.mockRestore();
    });

    it('filters using tags when only tags are present', () => {
      const tagsSpy = jest.spyOn(parseUtil, 'parseTags').mockReturnValue(['tag1']);
      const keywordSpy = jest.spyOn(parseUtil, 'parseKeyword').mockReturnValue([]);
      const tagCheckSpy = jest
        .spyOn(tagService, 'checkTagInQuestion')
        .mockImplementation(q => q.tags[0].name === 'tag1');

      const res = filterQuestionsBySearch(makeQuestions(), '[tag1]');

      expect(tagCheckSpy).toHaveBeenCalled();
      expect(res).toHaveLength(1);
      expect(res[0].tags[0].name).toBe('tag1');

      tagsSpy.mockRestore();
      keywordSpy.mockRestore();
      tagCheckSpy.mockRestore();
    });

    it('filters using keywords when no tags present', () => {
      const tagsSpy = jest.spyOn(parseUtil, 'parseTags').mockReturnValue([]);
      const keywordSpy = jest.spyOn(parseUtil, 'parseKeyword').mockReturnValue(['Keyword']);
      const tagCheckSpy = jest.spyOn(tagService, 'checkTagInQuestion').mockReturnValue(false);

      const res = filterQuestionsBySearch(makeQuestions(), 'Keyword');

      expect(tagCheckSpy).toHaveBeenCalledWith(expect.anything(), ['Keyword']);
      expect(res).toHaveLength(1);
      expect(res[0].title).toContain('Keyword');

      tagsSpy.mockRestore();
      keywordSpy.mockRestore();
      tagCheckSpy.mockRestore();
    });

    it('matches when either keyword or tag matches', () => {
      const tagsSpy = jest.spyOn(parseUtil, 'parseTags').mockReturnValue(['tag2']);
      const keywordSpy = jest.spyOn(parseUtil, 'parseKeyword').mockReturnValue(['Keyword']);
      const tagCheckSpy = jest
        .spyOn(tagService, 'checkTagInQuestion')
        .mockImplementation((q, list) => q.tags.some((t: any) => list.includes(t.name)));

      const res = filterQuestionsBySearch(makeQuestions(), '[tag2] keyword');

      expect(res).toHaveLength(2);

      tagsSpy.mockRestore();
      keywordSpy.mockRestore();
      tagCheckSpy.mockRestore();
    });
  });

  describe('fetchAndIncrementQuestionViewsById', () => {
    const qid = VALID_OBJECT_ID;
    const hiddenId = ANOTHER_OBJECT_ID;
    const otherId = THIRD_OBJECT_ID;

    const makeQuestion = (overrides: Partial<any> = {}) => {
      const idValue = overrides._id ?? VALID_OBJECT_ID;
      return {
        _id: { toString: () => idValue },
        askedBy: 'viewer',
        ...overrides,
      } as any;
    };

    const mockViewerHidden = (hidden: string[]) => {
      const select = jest.fn().mockResolvedValue({ hiddenQuestions: hidden });
      jest.spyOn(UserModel, 'findOne').mockReturnValue({ select } as any);
    };

    it('returns question when viewer is allowed to see it', async () => {
      const question = makeQuestion({ askedBy: 'viewer' });
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockReturnValue(makePopulateQuery(question) as any);
      jest.spyOn(userService, 'getRelations').mockResolvedValueOnce({ error: 'none' } as any);
      jest.spyOn(userService, 'getUsersWhoBlocked').mockResolvedValueOnce({ error: 'none' } as any);
      mockViewerHidden([qid]);

      const res = await fetchAndIncrementQuestionViewsById(qid, 'viewer');

      expect(res).toBe(question);
    });

    it('returns access denied when viewer blocked the author', async () => {
      const question = makeQuestion({ askedBy: 'author', _id: qid });
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockReturnValue(makePopulateQuery(question) as any);
      jest.spyOn(userService, 'getRelations').mockResolvedValueOnce({
        blockedUsers: ['author'],
      } as any);
      jest.spyOn(userService, 'getUsersWhoBlocked').mockResolvedValueOnce([]);
      mockViewerHidden([]);

      const res = await fetchAndIncrementQuestionViewsById(qid, 'viewer');

      expect(res).toEqual({ error: 'Access denied' });
    });

    it('returns access denied when viewer hid the question and is not the author', async () => {
      const question = makeQuestion({ askedBy: 'someoneElse', _id: hiddenId });
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockReturnValue(makePopulateQuery(question) as any);
      jest.spyOn(userService, 'getRelations').mockResolvedValueOnce({ blockedUsers: [] } as any);
      jest.spyOn(userService, 'getUsersWhoBlocked').mockResolvedValueOnce([]);
      mockViewerHidden([hiddenId]);

      const res = await fetchAndIncrementQuestionViewsById(hiddenId, 'viewer');

      expect(res).toEqual({ error: 'Access denied' });
    });

    it('returns generic error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue(makePopulateQuery(null) as any);
      jest.spyOn(userService, 'getRelations').mockResolvedValueOnce({ blockedUsers: [] } as any);
      jest.spyOn(userService, 'getUsersWhoBlocked').mockResolvedValueOnce([]);
      mockViewerHidden([]);

      const res = await fetchAndIncrementQuestionViewsById(otherId, 'viewer');

      expect(res).toEqual({ error: 'Error when fetching and updating a question' });
    });

    it('returns generic error when query throws', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('db failure')),
      } as any);

      const res = await fetchAndIncrementQuestionViewsById(qid, 'viewer');

      expect(res).toEqual({ error: 'Error when fetching and updating a question' });
    });
  });

  describe('saveQuestion', () => {
    it('returns created question on success', async () => {
      const question = { title: 'New' } as any;
      jest.spyOn(QuestionModel, 'create').mockResolvedValueOnce(question);

      const res = await saveQuestion(question);

      expect(res).toBe(question);
    });

    it('returns error when creation fails', async () => {
      jest.spyOn(QuestionModel, 'create').mockRejectedValueOnce(new Error('fail'));

      const res = await saveQuestion({} as any);

      expect(res).toEqual({ error: 'Error when saving a question' });
    });
  });

  describe('addVoteToQuestion', () => {
    it('handles upvote add and returns success message', async () => {
      const updated = { upVotes: ['user1'], downVotes: [] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(updated);

      const res = await addVoteToQuestion('qid', 'user1', 'upvote');

      expect(res).toEqual({
        msg: 'Question upvoted successfully',
        upVotes: ['user1'],
        downVotes: [],
      });
    });

    it('handles upvote cancellation', async () => {
      const updated = { upVotes: [], downVotes: [] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(updated);

      const res = await addVoteToQuestion('qid', 'user1', 'upvote');

      expect('msg' in res).toBe(true);
      if ('msg' in res) {
        expect(res.msg).toBe('Upvote cancelled successfully');
      }
    });

    it('handles downvote add and cancellation', async () => {
      const added = { upVotes: [], downVotes: ['user1'] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(added);
      const success = await addVoteToQuestion('qid', 'user1', 'downvote');
      expect('msg' in success).toBe(true);
      if ('msg' in success) {
        expect(success.msg).toBe('Question downvoted successfully');
      }

      const removed = { upVotes: [], downVotes: [] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(removed);
      const cancelled = await addVoteToQuestion('qid', 'user1', 'downvote');
      expect('msg' in cancelled).toBe(true);
      if ('msg' in cancelled) {
        expect(cancelled.msg).toBe('Downvote cancelled successfully');
      }
    });

    it('returns error when question is missing', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(null as any);

      const res = await addVoteToQuestion('qid', 'user1', 'upvote');

      expect(res).toEqual({ error: 'Question not found!' });
    });

    it('returns specific error when database update fails', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('fail'));
      const upvote = await addVoteToQuestion('qid', 'user1', 'upvote');
      expect(upvote).toEqual({ error: 'Error when adding upvote to question' });

      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('fail'));
      const downvote = await addVoteToQuestion('qid', 'user1', 'downvote');
      expect(downvote).toEqual({ error: 'Error when adding downvote to question' });
    });
  });

  describe('updateQuestion', () => {
    const baseQuestion = {
      _id: 'qid',
      askedBy: 'author',
      title: 'Old title',
      text: 'Old text',
      tags: [{ _id: 'old' }],
    } as any;

    const validTags = [{ _id: 'tag1' }, { _id: 'tag2' }] as any[];

    it('returns error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await updateQuestion(VALID_OBJECT_ID, 'title', 'text', validTags, 'author');

      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns error when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'other' } as any);

      const res = await updateQuestion('qid', 'title', 'text', validTags, 'author');

      expect(res).toEqual({ error: 'Unauthorized: You can only edit your own questions' });
    });

    it('validates title and text are not empty', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);

      const res = await updateQuestion('qid', '   ', '   ', validTags, 'author');

      expect(res).toEqual({ error: 'Title and text cannot be empty' });
    });

    it('validates title length', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);
      const longTitle = 'a'.repeat(101);

      const res = await updateQuestion('qid', longTitle, 'text', validTags, 'author');

      expect(res).toEqual({ error: 'Title must be 100 characters or less' });
    });

    it('requires at least one tag', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);

      const res = await updateQuestion('qid', 'title', 'text', [], 'author');

      expect(res).toEqual({ error: 'At least one tag is required' });
    });

    it('rejects more than five tags', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);

      const res = await updateQuestion(
        'qid',
        'title',
        'text',
        Array(6).fill({ _id: 't' }) as any[],
        'author',
      );

      expect(res).toEqual({ error: 'Maximum 5 tags allowed' });
    });

    it('returns error when update fails to produce a document', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);
      const countSpy = jest.spyOn(QuestionVersionModel, 'countDocuments').mockResolvedValueOnce(0);
      const createSpy = jest.spyOn(QuestionVersionModel, 'create').mockResolvedValueOnce({} as any);
      const populate = jest.fn().mockResolvedValue(null);
      const updateSpy = jest
        .spyOn(QuestionModel, 'findByIdAndUpdate')
        .mockReturnValue({ populate } as any);

      const res = await updateQuestion(VALID_OBJECT_ID, 'title', 'text', validTags, 'author');

      expect(res).toEqual({ error: 'Failed to update question' });

      updateSpy.mockRestore();
      countSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('updates question and records version history', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);
      const countSpy = jest.spyOn(QuestionVersionModel, 'countDocuments').mockResolvedValueOnce(2);
      const createSpy = jest.spyOn(QuestionVersionModel, 'create').mockResolvedValueOnce({} as any);
      const updatedQuestion = { _id: 'qid', title: 'title', tags: validTags } as any;
      const populate = jest.fn().mockResolvedValue(updatedQuestion);
      const updateSpy = jest
        .spyOn(QuestionModel, 'findByIdAndUpdate')
        .mockReturnValue({ populate } as any);

      const res = await updateQuestion(VALID_OBJECT_ID, ' title ', ' text ', validTags, 'author');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: expect.any(ObjectId),
          versionNumber: 3,
          title: 'Old title',
        }),
      );
      expect(populate).toHaveBeenCalled();
      expect(res).toBe(updatedQuestion);

      updateSpy.mockRestore();
      countSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('returns error when an exception is thrown', async () => {
      jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('db failure'));

      const res = await updateQuestion('qid', 'title', 'text', validTags, 'author');

      expect(res).toEqual({ error: 'Error when updating question' });
    });
  });

  describe('getCommunityQuestions', () => {
    it('returns questions for a community', async () => {
      const questions = [{ _id: 'q1' }] as any;
      jest.spyOn(QuestionModel, 'find').mockResolvedValueOnce(questions);

      const res = await getCommunityQuestions('community');

      expect(res).toBe(questions);
    });

    it('returns empty array when query fails', async () => {
      jest.spyOn(QuestionModel, 'find').mockRejectedValueOnce(new Error('fail'));

      const res = await getCommunityQuestions('community');

      expect(res).toEqual([]);
    });
  });

  describe('addFollowerToQuestion', () => {
    const follower = { _id: 'userId' } as any;

    it('returns error when user lookup fails', async () => {
      jest
        .spyOn(userService, 'getUserByUsername')
        .mockResolvedValueOnce({ error: 'missing' } as any);

      const res = await addFollowerToQuestion('qid', 'user');

      expect(res).toEqual({ error: 'User not found' });
    });

    it('follows a question when not already followed', async () => {
      jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(follower);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ followers: [] } as any);
      const resultDoc = { followers: [{ username: 'user' }] } as any;
      (QuestionModel as any).findOneAndUpdate = jest
        .fn()
        .mockReturnValue(makePopulateQuery(resultDoc));

      const res = await addFollowerToQuestion('qid', 'user');

      expect(res).toEqual({
        msg: 'Question followed successfully',
        followers: resultDoc.followers,
      });
    });

    it('unfollows a question when already followed', async () => {
      jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(follower);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({
        followers: ['userId'],
      } as any);
      const resultDoc = { followers: [] } as any;
      (QuestionModel as any).findOneAndUpdate = jest
        .fn()
        .mockReturnValue(makePopulateQuery(resultDoc));

      const res = await addFollowerToQuestion('qid', 'user');

      expect('msg' in res).toBe(true);
      if ('msg' in res) {
        expect(res.msg).toBe('Question unfollowed successfully');
      }
    });

    it('returns error when update result is null', async () => {
      jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(follower);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ followers: [] } as any);
      (QuestionModel as any).findOneAndUpdate = jest.fn().mockReturnValue(makePopulateQuery(null));

      const res = await addFollowerToQuestion('qid', 'user');

      expect(res).toEqual({ error: 'Error adding follower!' });
    });

    it('returns error when an exception occurs', async () => {
      jest.spyOn(userService, 'getUserByUsername').mockImplementation(() => {
        throw new Error('db failure');
      });

      const res = await addFollowerToQuestion('qid', 'user');

      expect(res).toEqual({ error: 'Error when following question' });
    });
  });

  //
  // deleteQuestion (existing tests)
  //
  it('deleteQuestion returns error when question not found', async () => {
    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

    const res = await deleteQuestion('nonexistentId', 'user1');

    expect(res).toEqual({ error: 'Question not found' });
  });

  //
  // updateQuestion
  //
  describe('updateQuestion', () => {
    const qid = '64b0f0c7dfb09bb8b6f0a001';
    const username = 'author';
    const baseQuestion = {
      _id: qid,
      askedBy: username,
      title: 'Old title',
      text: 'Old text',
      tags: [{ _id: 'tag-old' }],
    } as any;

    it('returns error when question is not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await updateQuestion(qid, 'Title', 'Body', [{ _id: 'tag1' } as any], username);
      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns unauthorized when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'other' } as any);

      const res = await updateQuestion(qid, 'Title', 'Body', [{ _id: 'tag1' } as any], username);
      expect(res).toEqual({ error: 'Unauthorized: You can only edit your own questions' });
    });

    it('validates blank title/text', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);

      const res = await updateQuestion(qid, '   ', 'Body', [{ _id: 'tag1' } as any], username);
      expect(res).toEqual({ error: 'Title and text cannot be empty' });
    });

    it('validates max title length', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);

      const res = await updateQuestion(
        qid,
        'x'.repeat(101),
        'Body',
        [{ _id: 'tag1' } as any],
        username,
      );
      expect(res).toEqual({ error: 'Title must be 100 characters or less' });
    });

    it('requires between 1 and 5 tags', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValue(baseQuestion);

      let res = await updateQuestion(qid, 'Title', 'Body', [], username);
      expect(res).toEqual({ error: 'At least one tag is required' });

      const tooManyTags = Array.from({ length: 6 }, (_, idx) => ({ _id: `t${idx}` })) as any;
      res = await updateQuestion(qid, 'Title', 'Body', tooManyTags, username);
      expect(res).toEqual({ error: 'Maximum 5 tags allowed' });
    });

    it('saves version snapshot and updates question', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(baseQuestion);
      MockedQuestionVersionModel.countDocuments.mockResolvedValueOnce(2 as any);
      MockedQuestionVersionModel.create.mockResolvedValueOnce({} as any);

      const populatedQuestion = { _id: qid, title: 'New title' } as any;
      const populateMock = jest.fn().mockResolvedValue(populatedQuestion);
      jest.spyOn(QuestionModel, 'findByIdAndUpdate').mockReturnValue({
        populate: populateMock,
      } as any);

      const res = await updateQuestion(
        qid,
        ' New title ',
        ' New text ',
        [{ _id: 'tag1' } as any],
        username,
      );

      expect(res).toBe(populatedQuestion);
    });
  });

  it('deleteQuestion returns error when user is not the author', async () => {
    const mockQuestion = { askedBy: 'otherUser' } as any;

    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(mockQuestion);

    const res = await deleteQuestion('qid', 'user1');

    expect(res).toEqual({
      error: 'Unauthorized: You can only delete your own questions',
    });
  });

  it('deleteQuestion deletes question and related resources on success', async () => {
    const mockQuestion = {
      _id: 'qid',
      askedBy: 'ownerUser',
      answers: ['a1', 'a2'],
      comments: ['c1', 'c2'],
    } as any;

    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(mockQuestion);
    jest.spyOn(AnswerModel, 'deleteMany').mockResolvedValueOnce({} as any);
    MockedQuestionVersionModel.deleteMany.mockResolvedValueOnce({} as any);
    jest.spyOn(CommentModel, 'deleteMany').mockResolvedValueOnce({} as any);
    jest.spyOn(QuestionModel, 'findByIdAndDelete').mockResolvedValueOnce({} as any);

    const res = await deleteQuestion('qid', 'ownerUser');

    expect(res).toHaveProperty('msg');
    expect(AnswerModel.deleteMany).toHaveBeenCalled();
    expect(MockedQuestionVersionModel.deleteMany).toHaveBeenCalled();
    expect(CommentModel.deleteMany).toHaveBeenCalled();
    expect(QuestionModel.findByIdAndDelete).toHaveBeenCalledWith('qid');
  });

  it('deleteQuestion returns generic error when an exception is thrown', async () => {
    jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('DB failure'));

    const res = await deleteQuestion('qid', 'user1');

    expect(res).toEqual({ error: 'Error when deleting question' });
  });

  //
  // getQuestionVersions
  //
  describe('getQuestionVersions', () => {
    const qid = '64b0f0c7dfb09bb8b6f0a002';

    it('returns versions when user is the author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'user1' } as any);
      const versions = [{ versionNumber: 1 }] as any;
      const populate = jest.fn().mockReturnValue(makeQueryThenable(versions));
      const sort = jest.fn().mockReturnValue({ populate });
      (QuestionVersionModel as any).find = jest.fn().mockReturnValue({ sort });

      const res = await getQuestionVersions(VALID_OBJECT_ID, 'user1');

      expect(sort).toHaveBeenCalledWith({ versionNumber: 1 });
      expect(res).toBe(versions);
    });

    it('returns error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await getQuestionVersions(qid, 'user1');

      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns unauthorized error when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'otherUser' } as any);

      const res = await getQuestionVersions(qid, 'user1');

      expect(res).toEqual({
        error: 'Unauthorized: Only the question author can view version history',
      });
    });

    it('returns error when an exception is thrown', async () => {
      jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('DB failure'));

      const res = await getQuestionVersions(qid, 'user1');

      expect(res).toEqual({ error: 'Error when fetching question versions' });
    });

    it('returns versions when user is the author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'user1' } as any);

      const versions = [{ versionNumber: 1 }];
      MockedQuestionVersionModel.find.mockReturnValue(makeQueryThenable(versions) as any);

      const res = await getQuestionVersions(qid, 'user1');

      expect(res).toEqual(versions);
    });
  });

  //
  // addFollowerToQuestion
  //
  describe('addFollowerToQuestion', () => {
    const followerId = 'user-object-id';

    beforeEach(() => {
      mockedGetUserByUsername.mockReset();
    });

    it('returns error when user is not found', async () => {
      mockedGetUserByUsername.mockResolvedValueOnce({ error: 'no user' } as any);

      const res = await addFollowerToQuestion('qid', 'alice');
      expect(res).toEqual({ error: 'User not found' });
    });

    it('follows a question when not already following', async () => {
      mockedGetUserByUsername.mockResolvedValueOnce({ _id: followerId } as any);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ followers: [] } as any);
      const resultDoc = { followers: [{ username: 'alice' }] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(resultDoc),
      } as any);

      const res = await addFollowerToQuestion('qid', 'alice');
      expect(res).toEqual({
        msg: 'Question followed successfully',
        followers: resultDoc.followers,
      });
    });

    it('unfollows a question when already following', async () => {
      mockedGetUserByUsername.mockResolvedValueOnce({ _id: followerId } as any);
      jest
        .spyOn(QuestionModel, 'findById')
        .mockResolvedValueOnce({ followers: [followerId] } as any);
      const resultDoc = { followers: [] } as any;
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(resultDoc),
      } as any);

      const res = await addFollowerToQuestion('qid', 'alice');
      expect(res).toEqual({
        msg: 'Question unfollowed successfully',
        followers: [],
      });
    });

    it('returns error when update result is null', async () => {
      mockedGetUserByUsername.mockResolvedValueOnce({ _id: followerId } as any);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ followers: [] } as any);
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(null) } as any);

      const res = await addFollowerToQuestion('qid', 'alice');
      expect(res).toEqual({ error: 'Error adding follower!' });
    });

    it('returns error when operation throws', async () => {
      mockedGetUserByUsername.mockResolvedValueOnce({ _id: followerId } as any);
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ followers: [] } as any);
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockImplementation(() => {
        throw new Error('boom');
      });

      const res = await addFollowerToQuestion('qid', 'alice');
      expect(res).toEqual({ error: 'Error when following question' });
    });
  });

  //
  // rollbackQuestion
  //
  describe('rollbackQuestion', () => {
    const qid = VALID_OBJECT_ID;
    const username = 'author';

    it('returns error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns unauthorized when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'other' } as any);

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({
        error: 'Unauthorized: You can only rollback your own questions',
      });
    });

    it('returns error when version not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: username } as any);

      MockedQuestionVersionModel.findById.mockReturnValue(makeQueryThenable(null));

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({ error: 'Version not found' });
    });

    it('returns error when version does not belong to question', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: username } as any);

      const versionDoc = {
        questionId: { toString: () => 'other-question-id' },
      } as any;

      MockedQuestionVersionModel.findById.mockReturnValue(makeQueryThenable(versionDoc));

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({ error: 'Version does not belong to this question' });
    });

    it('rolls back question when inputs are valid', async () => {
      const questionDoc = {
        askedBy: username,
        title: 'current title',
        text: 'current text',
        tags: [{ _id: 'oldTag' }],
      } as any;
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(questionDoc);

      const versionDoc = {
        questionId: { toString: () => qid },
        title: 'previous title',
        text: 'previous text',
        tags: [{ _id: 'tag1' }],
      } as any;
      (QuestionVersionModel as any).findById = jest
        .fn()
        .mockReturnValue(makeQueryThenable(versionDoc));

      const countSpy = jest.spyOn(QuestionVersionModel, 'countDocuments').mockResolvedValueOnce(1);
      const createSpy = jest.spyOn(QuestionVersionModel, 'create').mockResolvedValueOnce({} as any);

      const rolledBack = { title: 'previous title' } as any;
      const populate = jest.fn().mockResolvedValue(rolledBack);
      const updateSpy = jest
        .spyOn(QuestionModel, 'findByIdAndUpdate')
        .mockReturnValue({ populate } as any);

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: expect.any(ObjectId),
          versionNumber: 2,
        }),
      );
      expect(res).toBe(rolledBack);

      updateSpy.mockRestore();
      countSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('returns error when an exception is thrown', async () => {
      jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('DB failure'));

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({ error: 'Error when rolling back question' });
    });

    it('rolls back question successfully', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({
        askedBy: username,
        title: 'Old',
        text: 'Old text',
        tags: [{ _id: 'old-tag' }],
      } as any);

      const versionDoc = {
        questionId: { toString: () => qid },
        title: 'Version title',
        text: 'Version text',
        tags: [{ _id: 'new-tag' }],
      } as any;
      MockedQuestionVersionModel.findById.mockReturnValue(makeQueryThenable(versionDoc));
      MockedQuestionVersionModel.countDocuments.mockResolvedValueOnce(1 as any);
      MockedQuestionVersionModel.create.mockResolvedValueOnce({} as any);
      const populateMock = jest.fn().mockResolvedValue({ _id: qid, title: 'Version title' });
      jest.spyOn(QuestionModel, 'findByIdAndUpdate').mockReturnValue({
        populate: populateMock,
      } as any);

      const res = await rollbackQuestion(qid, '64b0f0c7dfb09bb8b6f0a004', username);

      expect(res).toEqual({ _id: qid, title: 'Version title' });
    });
  });

  //
  // saveDraft
  //
  describe('saveDraft', () => {
    it('returns error when savedDraft is falsy', async () => {
      jest.spyOn(DraftModel.prototype, 'save').mockResolvedValueOnce(null as any);

      const res = await saveDraft('Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ error: 'Failed to save draft' });
    });

    it('returns populated draft on success', async () => {
      const savedDraft = { _id: 'draft-id' } as any;
      const populatedDraft = { _id: 'draft-id', title: 'Title' } as any;

      jest.spyOn(DraftModel.prototype, 'save').mockResolvedValueOnce(savedDraft);

      const populateCommunity = jest.fn().mockResolvedValueOnce(populatedDraft);
      const populateTags = jest.fn().mockReturnValue({
        populate: populateCommunity,
      });
      (DraftModel as any).findById = jest.fn().mockReturnValue({
        populate: populateTags,
      });

      const res = await saveDraft('Title', 'Text', [], 'user1', null);

      expect(res).toEqual(populatedDraft);
    });

    it('returns savedDraft when populated draft is null', async () => {
      const savedDraft = { _id: 'draft-id' } as any;

      jest.spyOn(DraftModel.prototype, 'save').mockResolvedValueOnce(savedDraft);

      const populateCommunity = jest.fn().mockResolvedValueOnce(null as any);
      const populateTags = jest.fn().mockReturnValue({
        populate: populateCommunity,
      });
      (DraftModel as any).findById = jest.fn().mockReturnValue({
        populate: populateTags,
      });

      const res = await saveDraft('Title', 'Text', [], 'user1', null);

      expect(res).toEqual(savedDraft);
    });

    it('returns error when populate after save fails', async () => {
      const savedDraft = { _id: 'draft-id' } as any;

      jest.spyOn(DraftModel.prototype, 'save').mockResolvedValueOnce(savedDraft);

      const failingPopulate = jest.fn(() => {
        throw new Error('populate error');
      });
      (DraftModel as any).findById = jest.fn().mockReturnValue({
        populate: failingPopulate,
      });

      const res = await saveDraft('Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ error: 'Failed to populate draft after saving' });
    });

    it('returns error when an exception is thrown while saving', async () => {
      jest.spyOn(DraftModel.prototype, 'save').mockRejectedValueOnce(new Error('DB failure'));

      const res = await saveDraft('Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ error: 'Error when saving draft' });
    });
  });

  //
  // updateDraft
  //
  describe('updateDraft', () => {
    it('returns error when draft not found or unauthorized', async () => {
      (DraftModel as any).findOneAndUpdate = jest.fn().mockResolvedValueOnce(null as any);

      const res = await updateDraft('draft-id', 'Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ error: 'Draft not found or unauthorized' });
    });

    it('returns populated draft on success', async () => {
      const updatedDraft = {
        _id: 'draft-id',
        toObject: jest.fn().mockReturnValue({ id: 'draft-id' }),
      } as any;
      const populatedDraft = { _id: 'draft-id', title: 'New Title' } as any;

      (DraftModel as any).findOneAndUpdate = jest.fn().mockResolvedValueOnce(updatedDraft);

      const populateCommunity = jest.fn().mockResolvedValueOnce(populatedDraft);
      const populateTags = jest.fn().mockReturnValue({
        populate: populateCommunity,
      });
      (DraftModel as any).findById = jest.fn().mockReturnValue({
        populate: populateTags,
      });

      const res = await updateDraft('draft-id', 'New Title', 'Text', [], 'user1', null);

      expect(res).toEqual(populatedDraft);
    });

    it('returns updatedDraft.toObject when populate fails', async () => {
      const updatedDraft = {
        _id: 'draft-id',
        toObject: jest.fn().mockReturnValue({ id: 'draft-id' }),
      } as any;

      (DraftModel as any).findOneAndUpdate = jest.fn().mockResolvedValueOnce(updatedDraft);

      const failingPopulate = jest.fn(() => {
        throw new Error('populate error');
      });
      (DraftModel as any).findById = jest.fn().mockReturnValue({
        populate: failingPopulate,
      });

      const res = await updateDraft('draft-id', 'New Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ id: 'draft-id' });
    });

    it('returns error when an exception is thrown while updating', async () => {
      (DraftModel as any).findOneAndUpdate = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB failure'));

      const res = await updateDraft('draft-id', 'New Title', 'Text', [], 'user1', null);

      expect(res).toEqual({ error: 'Error when updating draft' });
    });
  });

  //
  // getUserDrafts
  //
  describe('getUserDrafts', () => {
    it('returns drafts on success', async () => {
      const drafts = [{ _id: 'd1' }, { _id: 'd2' }] as any;

      const sort = jest.fn().mockResolvedValueOnce(drafts);
      const populateCommunity = jest.fn().mockReturnValue({ sort });
      const populateTags = jest.fn().mockReturnValue({
        populate: populateCommunity,
      });
      (DraftModel as any).find = jest.fn().mockReturnValue({
        populate: populateTags,
      });

      const res = await getUserDrafts('user1');

      expect(res).toEqual(drafts);
    });

    it('returns error when an exception is thrown', async () => {
      (DraftModel as any).find = jest.fn().mockImplementation(() => {
        throw new Error('DB failure');
      });

      const res = await getUserDrafts('user1');

      expect(res).toEqual({ error: 'Error when retrieving drafts' });
    });
  });

  //
  // deleteDraft
  //
  describe('deleteDraft', () => {
    it('returns error when draft not found or unauthorized', async () => {
      (DraftModel as any).findOneAndDelete = jest.fn().mockResolvedValueOnce(null as any);

      const res = await deleteDraft('draft-id', 'user1');

      expect(res).toEqual({ error: 'Draft not found or unauthorized' });
    });

    it('returns success message when draft deleted', async () => {
      (DraftModel as any).findOneAndDelete = jest
        .fn()
        .mockResolvedValueOnce({ _id: 'draft-id' } as any);

      const res = await deleteDraft('draft-id', 'user1');

      expect(res).toEqual({ msg: 'Draft deleted successfully' });
    });

    it('returns error when an exception is thrown', async () => {
      (DraftModel as any).findOneAndDelete = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB failure'));

      const res = await deleteDraft('draft-id', 'user1');

      expect(res).toEqual({ error: 'Error when deleting draft' });
    });
  });

  //
  // publishDraft
  //
  describe('publishDraft', () => {
    it('returns error when draft not found or unauthorized', async () => {
      (DraftModel as any).findOne = jest.fn().mockReturnValue(makeQueryThenable(null));

      const res = await publishDraft('draft-id', 'user1');

      expect(res).toEqual({ error: 'Draft not found or unauthorized' });
    });

    it('returns error from saveQuestion when publishing fails', async () => {
      const draft = {
        title: 'Title',
        text: 'Text',
        tags: [{ name: 't1', description: 'd1' } as any],
        community: { _id: 'community-id' } as any,
      } as any;

      // Draft lookup: findOne(...).populate('tags').populate('community')
      const populateCommunity = jest.fn().mockResolvedValueOnce(draft);
      const populateTags = jest.fn().mockReturnValue({ populate: populateCommunity });

      (DraftModel as any).findOne = jest.fn().mockReturnValue({ populate: populateTags });

      // saveQuestion returns an error
      jest
        .spyOn(questionService, 'saveQuestion')
        .mockResolvedValueOnce({ error: 'Save failed' } as any);

      // Spy on delete (we expect NOT to call it)
      const deleteSpy = jest
        .spyOn(DraftModel as any, 'findByIdAndDelete')
        .mockResolvedValueOnce({} as any);

      const res = await publishDraft('draft-id', 'user1');

      expect(res).toEqual({ error: 'Save failed' });
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('publishes draft successfully, deletes draft, and returns question', async () => {
      const draft = {
        title: 'Title',
        text: 'Text',
        tags: [{ name: 't1', description: 'd1' } as any],
        community: { _id: 'community-id' } as any,
      } as any;

      // Draft lookup: findOne(...).populate('tags').populate('community')
      const populateCommunity = jest.fn().mockResolvedValueOnce(draft);
      const populateTags = jest.fn().mockReturnValue({ populate: populateCommunity });

      (DraftModel as any).findOne = jest.fn().mockReturnValue({ populate: populateTags });

      const questionResult = { _id: 'question-id', title: 'Title' } as any;
      jest.spyOn(questionService, 'saveQuestion').mockResolvedValueOnce(questionResult);

      const deleteSpy = jest
        .spyOn(DraftModel as any, 'findByIdAndDelete')
        .mockResolvedValueOnce({} as any);

      const res = await publishDraft('draft-id', 'user1');

      expect(res).toEqual(questionResult);
      expect(deleteSpy).toHaveBeenCalledWith('draft-id');
    });

    it('returns error when an exception is thrown', async () => {
      (DraftModel as any).findOne = jest.fn().mockImplementation(() => {
        throw new Error('DB failure');
      });

      const res = await publishDraft('draft-id', 'user1');

      expect(res).toEqual({ error: 'Error when publishing draft' });
    });
  });
});
