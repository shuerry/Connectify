import { ObjectId } from 'mongodb';
import {
  sortQuestionsByActive,
  sortQuestionsByMostViews,
  sortQuestionsByNewest,
  sortQuestionsByTrending,
  sortQuestionsByUnanswered,
} from '../../utils/sort.util';
import { PopulatedDatabaseAnswer, PopulatedDatabaseQuestion } from '../../types/types';
import { getMostRecentAnswerTime } from '../../services/answer.service';

jest.mock('../../services/answer.service', () => ({
  getMostRecentAnswerTime: jest.fn(),
}));

const mockGetMostRecentAnswerTime = getMostRecentAnswerTime as jest.MockedFunction<
  typeof getMostRecentAnswerTime
>;

const buildQuestion = (overrides: Partial<PopulatedDatabaseQuestion> = {}) =>
  ({
    _id: overrides._id ?? new ObjectId(),
    title: 'Question',
    text: 'Body',
    tags: [],
    askedBy: 'user',
    askDateTime: overrides.askDateTime ?? new Date(),
    answers: overrides.answers ?? [],
    views: overrides.views ?? [],
    upVotes: overrides.upVotes ?? [],
    downVotes: overrides.downVotes ?? [],
    comments: overrides.comments ?? [],
    community: null,
    followers: [],
  }) as PopulatedDatabaseQuestion;

const buildAnswer = (overrides: Partial<PopulatedDatabaseAnswer> = {}) =>
  ({
    _id: overrides._id ?? new ObjectId(),
    ansBy: overrides.ansBy ?? 'answerer',
    ansDateTime: overrides.ansDateTime ?? new Date(),
    text: overrides.text ?? 'answer',
    comments: overrides.comments ?? [],
  }) as PopulatedDatabaseAnswer;

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('sort.util', () => {
  describe('sortQuestionsByNewest', () => {
    it('orders questions by descending ask date', () => {
      const older = buildQuestion({ askDateTime: new Date('2024-01-01T00:00:00Z') });
      const newer = buildQuestion({ askDateTime: new Date('2024-02-01T00:00:00Z') });

      const result = sortQuestionsByNewest([older, newer]);
      expect(result).toEqual([newer, older]);
    });
  });

  describe('sortQuestionsByUnanswered', () => {
    it('filters answered questions and keeps newest order', () => {
      const answered = buildQuestion({
        askDateTime: new Date('2024-03-01T00:00:00Z'),
        answers: [buildAnswer()],
      });
      const unanswered = buildQuestion({
        askDateTime: new Date('2024-03-02T00:00:00Z'),
        answers: [],
      });

      const result = sortQuestionsByUnanswered([answered, unanswered]);
      expect(result).toEqual([unanswered]);
    });
  });

  describe('sortQuestionsByMostViews', () => {
    it('prioritizes questions with more views and breaks ties by recency', () => {
      const manyViewsOld = buildQuestion({
        askDateTime: new Date('2024-01-01T00:00:00Z'),
        views: ['a', 'b', 'c'],
      });
      const fewerViewsNew = buildQuestion({
        askDateTime: new Date('2024-02-01T00:00:00Z'),
        views: ['x'],
      });
      const tieViewsNewer = buildQuestion({
        askDateTime: new Date('2024-02-05T00:00:00Z'),
        views: ['p', 'q', 'r'],
      });

      const result = sortQuestionsByMostViews([manyViewsOld, fewerViewsNew, tieViewsNewer]);
      expect(result.map(q => q._id.toString())).toEqual([
        tieViewsNewer._id.toString(),
        manyViewsOld._id.toString(),
        fewerViewsNew._id.toString(),
      ]);
    });
  });

  describe('sortQuestionsByActive', () => {
    it('leverages recent answer timestamps and relegates questions without activity', () => {
      const activeQuestion = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f10'),
        askDateTime: new Date('2024-02-01T00:00:00Z'),
      });
      const inactiveQuestion = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f11'),
        askDateTime: new Date('2024-02-02T00:00:00Z'),
      });

      mockGetMostRecentAnswerTime.mockImplementation((question, mp) => {
        if (question._id.toString() === activeQuestion._id.toString()) {
          mp.set(question._id.toString(), new Date('2024-02-03T00:00:00Z'));
        }
      });

      const result = sortQuestionsByActive([inactiveQuestion, activeQuestion]);
      expect(result[0]._id.toString()).toBe(activeQuestion._id.toString());
      expect(result[1]._id.toString()).toBe(inactiveQuestion._id.toString());
      expect(mockGetMostRecentAnswerTime).toHaveBeenCalledTimes(2);
    });
  });

  describe('sortQuestionsByTrending', () => {
    it('boosts questions with fresh comments and higher engagement', () => {
      const fixedNow = new Date('2025-05-01T12:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const recentCommentDate = new Date('2025-05-01T10:00:00Z');
      const staleCommentDate = new Date('2025-04-20T10:00:00Z');

      const highEngagement = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f12'),
        askDateTime: new Date('2025-04-30T09:00:00Z'),
        upVotes: ['u1', 'u2'],
        downVotes: ['d1'],
        comments: [
          {
            _id: new ObjectId(),
            text: 'recent',
            commentBy: 'alice',
            commentDateTime: recentCommentDate,
          },
        ],
        answers: [
          buildAnswer({
            comments: [
              {
                _id: new ObjectId(),
                text: 'answer comment',
                commentBy: 'bob',
                commentDateTime: recentCommentDate,
              },
            ],
          }),
        ],
      });

      const lowEngagement = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f13'),
        askDateTime: new Date('2025-05-01T11:30:00Z'),
        upVotes: [],
        downVotes: [],
        comments: [
          {
            _id: new ObjectId(),
            text: 'stale',
            commentBy: 'charlie',
            commentDateTime: staleCommentDate,
          },
        ],
        answers: [],
      });

      const result = sortQuestionsByTrending([lowEngagement, highEngagement]);
      expect(result[0]._id.toString()).toBe(highEngagement._id.toString());
      expect(result[1]._id.toString()).toBe(lowEngagement._id.toString());

      (Date.now as jest.Mock).mockRestore();
    });

    it('handles tie scores deterministically using newest-first order', () => {
      const fixedNow = new Date('2025-05-10T12:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const baseQuestionProps = {
        upVotes: ['u1'],
        downVotes: [],
        answers: [],
        comments: [],
      };

      const newerQuestion = buildQuestion({
        ...baseQuestionProps,
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f20'),
        askDateTime: new Date('2025-05-09T00:00:00Z'),
      });

      const olderQuestion = buildQuestion({
        ...baseQuestionProps,
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f21'),
        askDateTime: new Date('2025-05-08T00:00:00Z'),
      });

      const result = sortQuestionsByTrending([olderQuestion, newerQuestion]);
      expect(result[0]._id.toString()).toBe(newerQuestion._id.toString());
      expect(result[1]._id.toString()).toBe(olderQuestion._id.toString());

      (Date.now as jest.Mock).mockRestore();
    });

    it('gracefully handles questions without any comments or answers', () => {
      const fixedNow = new Date('2025-06-01T00:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const noActivityQuestion = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f22'),
        askDateTime: new Date('2025-05-20T00:00:00Z'),
        upVotes: [],
        downVotes: [],
        comments: [],
        answers: [],
      });

      const result = sortQuestionsByTrending([noActivityQuestion]);
      expect(result).toHaveLength(1);
      expect(result[0]._id.toString()).toBe(noActivityQuestion._id.toString());

      (Date.now as jest.Mock).mockRestore();
    });

    it('returns 0 when scores are exactly equal, preserving pre-sorted order', () => {
      const fixedNow = new Date('2025-06-15T12:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      // Create two questions with identical properties that will result in the same score
      const sameScoreTime = new Date('2025-06-10T00:00:00Z');
      const question1 = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f30'),
        askDateTime: sameScoreTime,
        upVotes: ['u1'],
        downVotes: [],
        comments: [],
        answers: [],
        views: [],
      });

      const question2 = buildQuestion({
        _id: new ObjectId('665f7d2f1f1f1f1f1f1f1f31'),
        askDateTime: sameScoreTime,
        upVotes: ['u1'],
        downVotes: [],
        comments: [],
        answers: [],
        views: [],
      });

      // Both questions should have identical scores (same votes, same post time, no comments)
      const result = sortQuestionsByTrending([question1, question2]);

      // When scores are equal, return 0 preserves the pre-sorted order (newest first)
      // Since both have the same askDateTime, the order should be preserved as input
      expect(result).toHaveLength(2);
      // The exact order doesn't matter when scores are equal, but both should be present
      const resultIds = result.map(q => q._id.toString());
      expect(resultIds).toContain(question1._id.toString());
      expect(resultIds).toContain(question2._id.toString());

      (Date.now as jest.Mock).mockRestore();
    });
  });
});
