import CommentModel from '../../models/comments.model';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import { deleteComment } from '../../services/comment.service';

describe('deleteComment service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when comment not found', async () => {
    jest.spyOn(CommentModel, 'findById').mockResolvedValueOnce(null as any);

    const res = await deleteComment('nonexistentCid', 'user1');

    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).toMatch(/Comment not found/);
  });

  it('deletes comment on question when authorized by question owner', async () => {
    const mockComment = { _id: 'cid', commentBy: 'commenter' } as any;
    const mockQuestion = { _id: 'qid', askedBy: 'questionOwner', comments: ['cid'] } as any;

    jest.spyOn(CommentModel, 'findById').mockResolvedValueOnce(mockComment);
    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce(mockQuestion);
    jest.spyOn(CommentModel, 'findByIdAndDelete').mockResolvedValueOnce({} as any);
    jest.spyOn(QuestionModel, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

    const res = await deleteComment('cid', 'questionOwner');

    expect(res).toHaveProperty('msg');
    expect(CommentModel.findByIdAndDelete).toHaveBeenCalledWith('cid');
    expect(QuestionModel.findByIdAndUpdate).toHaveBeenCalledWith('qid', { $pull: { comments: 'cid' } });
    expect((res as { parentId?: string }).parentId).toBe('qid');
  });

  it('deletes comment on answer when authorized by answer owner', async () => {
    const mockComment = { _id: 'cid', commentBy: 'commenter' } as any;
    const mockAnswer = { _id: 'aid', ansBy: 'answerOwner', comments: ['cid'] } as any;
    const mockParentQuestion = { _id: 'qid', askedBy: 'questionOwner' } as any;

    jest.spyOn(CommentModel, 'findById').mockResolvedValueOnce(mockComment);
    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce(null as any); // not on question
    jest.spyOn(AnswerModel, 'findOne').mockResolvedValueOnce(mockAnswer);
    jest.spyOn(QuestionModel, 'findOne').mockResolvedValueOnce(mockParentQuestion); // parentQuestion lookup
    jest.spyOn(CommentModel, 'findByIdAndDelete').mockResolvedValueOnce({} as any);
    jest.spyOn(AnswerModel, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

    const res = await deleteComment('cid', 'answerOwner');

    expect(res).toHaveProperty('msg');
    expect(CommentModel.findByIdAndDelete).toHaveBeenCalledWith('cid');
    expect(AnswerModel.findByIdAndUpdate).toHaveBeenCalledWith('aid', { $pull: { comments: 'cid' } });
    expect((res as { parentId?: string }).parentId).toBe('aid');
  });
});
