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

## Email Verification

- **Goal** Users can verify their email addresses
- **Steps**
  1. While logged in as `hullaballoo`, navigate to the profile settings page via "View Profile"
  2. Click "Edit" underneath the email address field, and enter an email address
  3. Go to your email inbox, click the "Verify" button in the email
  4. Return to the profile page and verify that the email is marked as verified (black text, no 'not verified' tag)
  ![Edited email](./manual-testing-images/verification-1.png)
  ![Verification email](./manual-testing-images/verification-2.png)
  ![Verification page](./manual-testing-images/verification-3.png)
  ![Confirmed email](./manual-testing-images/verification-4.png)

- **Goal** Users can replace and verify a new email address
- **Steps**
  1. Repeat steps 1-4 of the previous test
  2. Click the "Edit" button again and enter a different email address
  3. Go to your email inbox, click the "Verify" button in the email
  4. Return to the profile page and verify the new email is listed and marked as verified.
  ![Edited email](./manual-testing-images/verification2-1.png)
  ![Verification email](./manual-testing-images/verification2-2.png)
  ![Verification page](./manual-testing-images/verification2-3.png)
  ![Confirmed email](./manual-testing-images/verification2-4.png)

## Notifications

- **Goal:** Followers receive an in-app notification when a new answer is posted. (Test A)
- **Steps:**
  1. As `hullaballoo`, open a post and click `Follow` (ensure button toggles to indicate following).
  2. Open another tab, sign in as `reactexpert` (`R3@ctM@ster!`), answer the same question, post the answer.
  3. Log back in as `hullaballoo`, visit `/notifications` (or use header button).
  4. Verify a notification card exists with title `New answer on: {question title}` and actor `@reactexpert`.
  ![Following question](./manual-testing-images/notifications1-1.png)
  ![Adding answer](./manual-testing-images/notifications1-2.png)
  ![Answer on question](./manual-testing-images/notifications1-3.png)
  ![Notification card](./manual-testing-images/notifications1-4.png)
  ![Open brought to question](./manual-testing-images/notifications1-5.png)
  ![Marked read](./manual-testing-images/notifications1-6.png)
  ![Deleted](./manual-testing-images/notifications1-7.png)

- **Goal:** Followers can open, mark as read, and delete recieved notifications
- **Steps:**
  1. Repeat steps 1-4 of the previous test
  2. Click the 'open' button. Verify that it takes you to the correct question.
  3. Navigate back to the notification. Verify that there is a blue dot on the notification bell in the header.
  4. Click 'mark as read' on the notification. Verify that the blue dot disappears on both the notification card and in the 
  header.
  5. Click  the delete button. Verify that the notification has been removed.
  ![Open brought to question](./manual-testing-images/notifications1-5.png)
  ![Marked read](./manual-testing-images/notifications1-6.png)
  ![Deleted](./manual-testing-images/notifications1-7.png)

- **Goal:** Deleting Notifications will remove the blue dot from the header
- **Steps:**
  1. Repeat steps 1-3 of the previous test
  2. Click the 'delete' button. Verify that the blue dot in the header has disappeared.
  ![Notification unread](./manual-testing-images/notifications3-1.png)
  ![Deleted](./manual-testing-images/notifications1-7.png)


- **Goal** Users recieve an email when there is a new answer to a followed question, if their email address is verified
  1. As `hullaballoo`, ensure that your email is verified as in previous tests
  2. Repeat steps 1-4 of the first notifications test (Test A)
  3. Go to your email inbox. Verify that there is an email notification corresponding to the added answer
  4. Click on the "View Question" button in the email. Verify that it navigates to the correct question.
  ![Email answer notification](./manual-testing-images/notifications4-1.png)

- **Goal:** Members of a chat recieve a notification when a new chat is sent, if they have notifications enabled
- **Steps:**
  1. As `hullaballoo`, send a friend request to `reactexpert`
  2. Open another tab, sign in as `weewoo` (`321`), accept the friend request.
  3. Enable notifications as `weewoo`.
  4. Switch back to `hullaballoo`, and send a message in the chat
  5. Switch back to `weewoo`, and click on the notification bell in the header. Verify that a notification exists for the chat.
  6. Click on 'open'. Verify that it takes you to the direct messages page. (Note that the expected behavior is not to open the specific chat)
  ![Chat sent](./manual-testing-images/notifications5-1.png)
  ![Message created](./manual-testing-images/notifications5-2.png)
  ![Verify link takes you to DM page](./manual-testing-images/notifications5-3.png)

  - **Goal** Users recieve an email when there is a new message in the chat, if their email address is verified and notifications are enabled
  1. As `hullaballoo`, ensure that your email is verified as in previous tests
  2. Repeat steps 1-5 of the previous test
  3. Go to your email inbox. Verify that there is an chat notification corresponding to the added message
  4. Click on the "View Chat" button in the email. Verify that it navigates to the direct messages page.
  ![Chat notification email](./manual-testing-images/notifications6-1.png)
  ![Routed to correct page](./manual-testing-images/notifications6-2.png)


- **Goal:** Members of a group chat recieve a notification when a new chat is sent, if they have notifications available. Those without notifications enabled do not.
- **Steps:**
  1. As `hullaballoo`, send a friend request to `weewoo` and `emailFan`
  2. Open another tab, sign in as `weewoo` (`321`), accept the friend request.
  3. Open another tab, sign in as `emailFan` (`1234`), accept the friend request.
  4. Switch back to `hullaballoo`, and create a group chat with `weewoo` and `emailFan`.
  5. Enable notifications as `hullaballoo`
  6. Switch to `weewoo`, enable notifications.
  7. Send a message as `weewoo`.
  8. Verify that `hullaballoo` recieved a notification, and `weewoo` and `emailFan` did not.
  ![Chat sent](./manual-testing-images/notifications7-4.png)
  ![Hullaballoo recieved notif](./manual-testing-images/notifications7-1.png)
  ![Emailfan did not](./manual-testing-images/notifications7-2.png)
  ![Weewoo did not](./manual-testing-images/notifications7-3.png)

- **Goal:** Users recieve an email when there is a new message in a group chat, if their email address is verified and notifications are enabled
- **Steps:**
  1. As `hullaballoo`, ensure that your email is verified as in previous tests
  2. Repeat steps 1-8 of the previous test
  3. Go to your email inbox. Verify that there is an chat notification corresponding to the added message
  4. Click on the "View Chat" button in the email. Verify that it navigates to the group chat page.
  ![Group chat notif](./manual-testing-images/notifications8-1.png)

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
