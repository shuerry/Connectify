import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import QuestionVersionModel from '../../models/questionVersions.model';
import CommentModel from '../../models/comments.model';
import DraftModel from '../../models/drafts.model';

import * as questionService from '../../services/question.service';

const {
  deleteQuestion,
  getQuestionVersions,
  rollbackQuestion,
  saveDraft,
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

describe('question.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //
  // deleteQuestion (existing tests)
  //
  it('deleteQuestion returns error when question not found', async () => {
    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

    const res = await deleteQuestion('nonexistentId', 'user1');

    expect(res).toEqual({ error: 'Question not found' });
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
    jest.spyOn(QuestionVersionModel, 'deleteMany').mockResolvedValueOnce({} as any);
    jest.spyOn(CommentModel, 'deleteMany').mockResolvedValueOnce({} as any);
    jest.spyOn(QuestionModel, 'findByIdAndDelete').mockResolvedValueOnce({} as any);

    const res = await deleteQuestion('qid', 'ownerUser');

    expect(res).toHaveProperty('msg');
    expect(AnswerModel.deleteMany).toHaveBeenCalled();
    expect(QuestionVersionModel.deleteMany).toHaveBeenCalled();
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
    it('returns error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await getQuestionVersions('qid', 'user1');

      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns unauthorized error when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'otherUser' } as any);

      const res = await getQuestionVersions('qid', 'user1');

      expect(res).toEqual({
        error: 'Unauthorized: Only the question author can view version history',
      });
    });

    it('returns error when an exception is thrown', async () => {
      jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('DB failure'));

      const res = await getQuestionVersions('qid', 'user1');

      expect(res).toEqual({ error: 'Error when fetching question versions' });
    });
  });

  //
  // rollbackQuestion
  //
  describe('rollbackQuestion', () => {
    const qid = 'question-id';
    const username = 'author';

    it('returns error when question not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(res).toEqual({ error: 'Question not found' });
    });

    it('returns unauthorized when user is not author', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: 'other' } as any);

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(res).toEqual({
        error: 'Unauthorized: You can only rollback your own questions',
      });
    });

    it('returns error when version not found', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: username } as any);

      (QuestionVersionModel as any).findById = jest.fn().mockReturnValue(makeQueryThenable(null));

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(res).toEqual({ error: 'Version not found' });
    });

    it('returns error when version does not belong to question', async () => {
      jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce({ askedBy: username } as any);

      const versionDoc = {
        questionId: { toString: () => 'other-question-id' },
      } as any;

      (QuestionVersionModel as any).findById = jest
        .fn()
        .mockReturnValue(makeQueryThenable(versionDoc));

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(res).toEqual({ error: 'Version does not belong to this question' });
    });

    it('returns error when an exception is thrown', async () => {
      jest.spyOn(QuestionModel, 'findById').mockRejectedValueOnce(new Error('DB failure'));

      const res = await rollbackQuestion(qid, 'version-id', username);

      expect(res).toEqual({ error: 'Error when rolling back question' });
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
