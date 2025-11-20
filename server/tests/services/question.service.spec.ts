import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import QuestionVersionModel from '../../models/questionVersions.model';
import CommentModel from '../../models/comments.model';
import { deleteQuestion } from '../../services/question.service';

describe('deleteQuestion service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when question not found', async () => {
    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(null as any);

    const res = await deleteQuestion('nonexistentId', 'user1');

    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).toMatch(/Question not found/);
  });

  it('returns error when user is not the author', async () => {
    const mockQuestion = { _id: 'qid', askedBy: 'ownerUser', comments: [] } as any;
    jest.spyOn(QuestionModel, 'findById').mockResolvedValueOnce(mockQuestion);

    const res = await deleteQuestion('qid', 'otherUser');

    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).toMatch(/Unauthorized/);
  });

  it('deletes related docs and the question when authorized', async () => {
    const mockQuestion = { _id: 'qid', askedBy: 'ownerUser', comments: ['c1', 'c2'] } as any;

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
});
