# Manual Testing Report

This document describes the manual regression checks performed for key product requirements that aren't yet fully automated in Cypress. Each section lists the environment prerequisites, step-by-step procedure, and the expected outcome that should be captured in accompanying screenshots.

## Environment Setup

1. Start MongoDB (`mongod` or Atlas cluster) with the seeded data the app expects.
2. In `server/`: `npm install` (first run) and `npm run dev`.
3. In `client/`: `npm install` (first run) and `npm run dev`.
4. Visit `http://localhost:4530`, sign in using seeded accounts (e.g., `user123` / `securePass123!`).

## Report & Moderation

- **Goal:** Reporters can submit a reason and authors see the moderation warning.
- **Steps:**
  1. While logged in as `user123`, choose a post and click `Report`.
  2. Enter a reason (e.g., “Content is off-topic {timestamp}”), submit, and confirm the card disappears or shows a reported badge.
  3. Log out, sign in as the author (`serverdev` / `B@ckendPr0!`), open that question.
  4. Confirm the red warning banner (`.reddit-report-warning`) displays the submitted reason.
- **Screenshot prompts:** Report modal submission, author view with the warning banner text.

## Receive Notifications

- **Goal:** Followers receive an in-app notification when a new answer is posted.
- **Steps:**
  1. As `user123`, open a post and click `Follow` (ensure button toggles to indicate following).
  2. Log out, sign in as `reactexpert` (`R3@ctM@ster!`), answer the same question, post the answer.
  3. Log back in as `user123`, visit `/notifications` (or use sidebar).
  4. Verify a notification card exists with title `New answer on: {question title}` and actor `@reactexpert`.
- **Screenshot prompts:** Notification detail card showing actor, CTA link, and timestamp.

## Profanity Guard

- **Goal:** Offensive content triggers the Profanity Filter modal and blocks submission.
- **Steps:**
  1. From the sidebar, click `Ask a Question`.
  2. Enter a title/body containing a known banned word (e.g., “Why is this shit allowed?”).
  3. Click `Post`. The question should not submit; instead the modal appears.
  4. Confirm the modal headline “Profanity Filter Alert”, listed words, and Close button work.
- **Screenshot prompts:** Modal overlay capturing the reason text mentioning the offending word.

## Question Sort by Trend

- **Goal:** Users can switch to the “Trending” order, triggering the API and updating the UI ordering.
- **Steps:**
  1. On the Questions page, click the `Trending` filter button.
  2. Observe the network call `GET /api/question/getQuestion?order=trending` succeeds (use browser dev tools).
  3. Ensure the list updates and the order matches the returned payload (titles re-render).
- **Screenshot prompts:** Question list with the `Trending` button highlighted and changed ordering; optional dev-tools network tab highlighting the 200 response.

### Auto-Save (Drafts) Feature

**Test Steps:**
1. Log in as a user.
2. Start creating a new question or post.
3. Enter a title and some content, but do NOT submit/publish.
4. Refresh the page or navigate away, then it should save under My Drafts
5. Observe if the previously entered content is restored automatically when you edit it.

**Expected Result:**
- The draft content (title and body) should be auto-saved and restored after refresh or navigation.
- No data loss should occur unless the user explicitly discards the draft.

### 2. Chats Feature

**Test Steps:**
1. Log in as User A.
2. Navigate to the chat or messaging section.
3. Start a new chat with User B (or select an existing chat).
4. Send a message to User B.
5. Log in as User B (in another browser or incognito window).
6. Open the chat with User A.
7. Verify that the message from User A appears.
8. Reply as User B and check that User A receives the reply in real time or after refresh.

**Expected Result:**
- Messages should be sent and received in real time (or after refresh).
- Chat history should persist and display correctly for both users.

- **Screenshot prompts:** 
