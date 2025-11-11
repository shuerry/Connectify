import { PopulatedDatabaseQuestion } from '../types/types';
import { getMostRecentAnswerTime } from '../services/answer.service';

const HOURS_IN_MS = 60 * 60 * 1000;

/**
 * Gets the newest questions from a list, sorted by the asking date in descending order.
 *
 * @param {PopulatedDatabaseQuestion[]} qlist - The list of questions to sort
 *
 * @returns {PopulatedDatabaseQuestion[]} - The sorted list of questions by ask date, newest first
 */
export const sortQuestionsByNewest = (
  qlist: PopulatedDatabaseQuestion[],
): PopulatedDatabaseQuestion[] =>
  qlist.sort((a, b) => {
    if (a.askDateTime > b.askDateTime) {
      return -1;
    }

    if (a.askDateTime < b.askDateTime) {
      return 1;
    }

    return 0;
  });

/**
 * Filters and sorts a list of questions to return only unanswered questions, sorted by the asking date in descending order.
 *
 * @param {PopulatedDatabaseQuestion[]} qlist - The list of questions to filter and sort
 *
 * @returns {PopulatedDatabaseQuestion[]} - The filtered list of unanswered questions, sorted by ask date, newest first
 */
export const sortQuestionsByUnanswered = (
  qlist: PopulatedDatabaseQuestion[],
): PopulatedDatabaseQuestion[] => sortQuestionsByNewest(qlist).filter(q => q.answers.length === 0);

/**
 * Filters and sorts a list of questions to return active questions, sorted by the most recent answer date in descending order.
 * Active questions are those with recent answers.
 *
 * @param {PopulatedDatabaseQuestion[]} qlist - The list of questions to filter and sort
 *
 * @returns {PopulatedDatabaseQuestion[]} - The filtered list of active questions, sorted by recent answer date and ask date
 */
export const sortQuestionsByActive = (
  qlist: PopulatedDatabaseQuestion[],
): PopulatedDatabaseQuestion[] => {
  const mp = new Map();

  qlist.forEach(q => {
    getMostRecentAnswerTime(q, mp);
  });

  return sortQuestionsByNewest(qlist).sort((a, b) => {
    const adate = mp.get(a._id.toString());
    const bdate = mp.get(b._id.toString());
    if (!adate) {
      return 1;
    }
    if (!bdate) {
      return -1;
    }
    if (adate > bdate) {
      return -1;
    }
    if (adate < bdate) {
      return 1;
    }
    return 0;
  });
};

/**
 * Sorts a list of questions by the number of views in descending order. If two questions have the same number of views,
 * the newer question will appear first.
 *
 * @param {PopulatedDatabaseQuestion[]} qlist - The array of questions to be sorted
 *
 * @returns {PopulatedDatabaseQuestion[]} - A new array of questions sorted by the number of views, then by creation date
 */
export const sortQuestionsByMostViews = (
  qlist: PopulatedDatabaseQuestion[],
): PopulatedDatabaseQuestion[] =>
  sortQuestionsByNewest(qlist).sort((a, b) => b.views.length - a.views.length);

/**
 * Sorts questions by a composite "trending" score designed to elevate recently popular discussions.
 * Popularity factors:
 * - Upvotes and downvotes (net votes)
 * - Number of comments (question + answers' comments)
 * - Recency of the most recent comment (question or answers)
 * - Post time (newer posts are boosted)
 */
export const sortQuestionsByTrending = (
  qlist: PopulatedDatabaseQuestion[],
): PopulatedDatabaseQuestion[] => {
  const now = Date.now();

  const scoreFor = (q: PopulatedDatabaseQuestion): number => {
    const netVotes = (q.upVotes?.length ?? 0) - (q.downVotes?.length ?? 0);

    // Count comments on question and on all answers
    const questionCommentsCount = q.comments?.length ?? 0;
    const answersCommentsCount =
      q.answers?.reduce((acc, ans) => acc + (ans.comments?.length ?? 0), 0) ?? 0;
    const totalComments = questionCommentsCount + answersCommentsCount;

    // Most recent comment time across question and answers
    const mostRecentCommentAt = (() => {
      const questionLatest =
        q.comments?.reduce<number>(
          (latest, c) =>
            Math.max(latest, c.commentDateTime ? new Date(c.commentDateTime).getTime() : 0),
          0,
        ) ?? 0;
      const answersLatest =
        q.answers?.reduce<number>((latestAns, ans) => {
          const ansLatest =
            ans.comments?.reduce<number>(
              (latestC, c) =>
                Math.max(latestC, c.commentDateTime ? new Date(c.commentDateTime).getTime() : 0),
              0,
            ) ?? 0;
          return Math.max(latestAns, ansLatest);
        }, 0) ?? 0;
      return Math.max(questionLatest, answersLatest);
    })();

    // Post time
    const askTime = new Date(q.askDateTime).getTime();

    // Decay factors: stronger boost for very recent comments, moderate boost for newer posts
    const hoursSinceLatestComment =
      mostRecentCommentAt > 0 ? (now - mostRecentCommentAt) / HOURS_IN_MS : Number.POSITIVE_INFINITY;
    const hoursSincePost = (now - askTime) / HOURS_IN_MS;

    const recentCommentBoost =
      mostRecentCommentAt > 0 ? Math.exp(-hoursSinceLatestComment / 24) : 0; // 1 day half-life
    const postRecencyBoost = Math.exp(-hoursSincePost / 48); // 2 day half-life

    // Base popularity: votes weigh more than comment count, but both matter
    const basePopularity = netVotes * 1.0 + totalComments * 0.5;

    // Final score blends base popularity with recency signals
    return basePopularity * (0.6 * recentCommentBoost + 0.4) + 2.0 * postRecencyBoost;
  };

  // Stable sort: pre-sort by newest to ensure deterministic tie-breaking
  const newestFirst = sortQuestionsByNewest([...qlist]);
  return newestFirst.sort((a, b) => {
    const sb = scoreFor(b);
    const sa = scoreFor(a);
    if (sb !== sa) return sb - sa;
    return 0;
  });
};
