# Manual Testing Report

This document describes the manual regression checks performed for key product requirements that aren't yet fully automated in Cypress. Each section lists the environment prerequisites, step-by-step procedure, and the expected outcome that should be captured in accompanying screenshots.

## Environment Setup

1. Start MongoDB (`mongod` or Atlas cluster) with the seeded data the app expects.
2. In `server/`: `npm install` (first run) and `npm run dev`.
3. In `client/`: `npm install` (first run) and `npm run dev`.
4. Visit `http://localhost:4530`, sign in using seeded accounts (e.g., `user123` / `securePass123!`).

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


## Save to Collection

- **Goal:** User can save/unsave a post via the dropdown modal and see the saved state reflected.
- **Steps:**
  1. Log in as `user123` and navigate to `Questions`.
  2. Open the "Save" dropdown on any post, choose `React Favorites`, then close the modal.
  3. Refresh the questions page, reopen the Save modal for the same post.
  4. Verify that `React Favorites` now shows the “Unsave” state.
- **Screenshot prompts:** Save modal showing the “saved” pill; the same modal after reloading showing persistence.
<img width="663" height="183" alt="Screenshot 2025-11-25 at 09 04 52" src="https://github.com/user-attachments/assets/5cff7e19-ccf0-47a2-a3e5-765b84c5ab49" />
<img width="640" height="173" alt="Screenshot 2025-11-25 at 09 04 59" src="https://github.com/user-attachments/assets/9168f6c7-a2e5-4203-a842-e0cd669fcbe9" />
<img width="1103" height="269" alt="Screenshot 2025-11-25 at 09 05 11" src="https://github.com/user-attachments/assets/499851d8-753e-47c3-be18-eac4d5aa4e7f" />


## Report & Moderation
- **Goal:** Reporters can submit a reason and authors see the moderation warning.
- **Steps:**
  1. While logged in as `user123`, choose a post and click `Report`.
  2. Enter a reason (e.g., “Content is off-topic {timestamp}”), submit, and confirm the card disappears or shows a reported badge.
  3. Log out, sign in as the author (`serverdev` / `B@ckendPr0!`), open that question.
  4. Confirm the red warning banner (`.reddit-report-warning`) displays the submitted reason.
- **Screenshot prompts:** Report modal submission, author view with the warning banner text.
<img width="909" height="310" alt="Screenshot 2025-11-25 at 09 09 29" src="https://github.com/user-attachments/assets/e21a9d63-8a84-4df2-9164-0b49e6cb73d2" />
<img width="1187" height="519" alt="Screenshot 2025-11-25 at 09 09 43" src="https://github.com/user-attachments/assets/02ef9f40-c5b9-49ea-af47-34151204f8d1" />


## Receive Notifications

- **Goal:** Followers receive an in-app notification when a new answer is posted.
- **Steps:**
  1. As `user123`, open a post and click `Follow` (ensure button toggles to indicate following).
  2. Log out, sign in as `reactexpert` (`R3@ctM@ster!`), answer the same question, post the answer.
  3. Log back in as `user123`, visit `/notifications` (or use sidebar).
  4. Verify a notification card exists with title `New answer on: {question title}` and actor `@reactexpert`.
- **Screenshot prompts:** Notification detail card showing actor, CTA link, and timestamp.
<img width="1170" height="711" alt="notifications1-1" src="https://github.com/user-attachments/assets/60810447-bb78-4a9d-8633-43ba477e82af" />
<img width="781" height="588" alt="notifications1-2" src="https://github.com/user-attachments/assets/1dc00638-6584-4cae-8757-702389f48993" />
<img width="863" height="409" alt="notifications1-3" src="https://github.com/user-attachments/assets/caf8e053-189b-4d8d-851b-dcd7760ee479" />
<img width="1180" height="862" alt="notifications1-4" src="https://github.com/user-attachments/assets/6dbb68ef-4b3a-412b-bdea-dbca74009da0" />
<img width="1138" height="1098" alt="notifications1-5" src="https://github.com/user-attachments/assets/3496416e-6a4d-4814-b721-cfde59cf8a52" />
<img width="1215" height="867" alt="notifications1-6" src="https://github.com/user-attachments/assets/083223a0-5018-4298-9578-707863afe1c1" />
<img width="1171" height="1069" alt="notifications1-7" src="https://github.com/user-attachments/assets/e63d6bf3-9557-43a4-a3ab-a6fb17f9b651" />




## Profanity Guard

- **Goal:** Offensive content triggers the Profanity Filter modal and blocks submission.
- **Steps:**
  1. From the sidebar, click `Ask a Question`.
  2. Enter a title/body containing a known banned word (e.g., “Why is this shit allowed?”).
  3. Click `Post`. The question should not submit; instead the modal appears.
  4. Confirm the modal headline “Profanity Filter Alert”, listed words, and Close button work.
<img width="622" height="572" alt="Screenshot 2025-11-25 at 09 15 30" src="https://github.com/user-attachments/assets/9c01f951-96ee-4507-82e3-dbbd3afc539b" />
<img width="657" height="362" alt="Screenshot 2025-11-25 at 09 15 16" src="https://github.com/user-attachments/assets/4456666b-bcce-43a1-b538-ece89eb2b3e0" />




## Question Sort by Trend

- **Goal:** Users can switch to the “Trending” order, triggering the API and updating the UI ordering.
- **Steps:**
  1. On the Questions page, click the `Trending` filter button.
  2. Observe the network call `GET /api/question/getQuestion?order=trending` succeeds (use browser dev tools).
  3. Ensure the list updates and the order matches the returned payload (titles re-render).
- **Screenshot prompts:** Question list with the `Trending` button highlighted and changed ordering; optional dev-tools network tab highlighting the 200 response.
<img width="549" height="701" alt="Screenshot 2025-11-25 at 09 17 16" src="https://github.com/user-attachments/assets/aa1dd192-1d21-4984-a1ec-d489874daef2" />
<img width="1220" height="240" alt="Screenshot 2025-11-25 at 09 17 43" src="https://github.com/user-attachments/assets/7d1d2189-65b4-47c4-850e-282029891c51" />
<img width="1204" height="515" alt="Screenshot 2025-11-25 at 09 17 34" src="https://github.com/user-attachments/assets/a8f0322d-015e-4173-9a06-b0a5273d8e8e" />


### Auto-Save (Drafts) Feature

**Test Steps:**
1. Log in as a user.
2. Start creating a new question or post.
3. Enter a title and some content, but do NOT submit/publish.
4. Refresh the page or navigate away, then return to the question creation page.
5. Observe if the previously entered content is restored automatically.

**Expected Result:**
- The draft content (title and body) should be auto-saved and restored after refresh or navigation.
- No data loss should occur unless the user explicitly discards the draft.

- **Screenshot prompts:** :
<img width="619" height="639" alt="Screenshot 2025-11-25 at 09 19 29" src="https://github.com/user-attachments/assets/cac4f1d2-7c15-43e0-a2da-65ceef7570fe" />
<img width="910" height="321" alt="Screenshot 2025-11-25 at 09 20 02" src="https://github.com/user-attachments/assets/5506c9b0-4802-46ce-ac60-63c65bd553d7" />


### Friend Request Feature

**Test Steps:**
1. Log in as User A.
2. Navigate to the direct message page.
3. Start a new chat with User B.
4. Send a friend request to user B.
5. Log in as User B (in another browser or incognito window).
6. Open the direct message chat with User A.
7. Verify that the friend request from User A appears.
8. Accept the friend request as User B and send a test message.

**Expected Result:**
- User A should see a warning saying "You can only message users who are your friends" when they try to create a chat with User B right away
- User A should not be able to send a message besides a friend request to User B until User B accepts the friend request
- Friend request status should be updated in real time.

- **Screenshot prompts:**
<img width="1030" height="362" alt="Screenshot 2025-11-25 at 09 27 12" src="https://github.com/user-attachments/assets/c7730e92-ca40-43a3-a545-c1651d412eb9" />
<img width="1209" height="435" alt="Screenshot 2025-11-25 at 09 27 34" src="https://github.com/user-attachments/assets/6d165314-c925-46ca-93b3-5327149e7a71" />
<img width="1223" height="686" alt="Screenshot 2025-11-25 at 09 27 44" src="https://github.com/user-attachments/assets/66f65602-fbfa-4884-9b92-00bcc52dbbad" />

### Group Chat Feature

**Test Steps:**
1. Log in as User A.
2. Navigate to the group chats page.
3. Click on the New Group Chat button.
4. Select friends to add to the group chat.
5. Optionally enter a group chat name.
6. Click Create Group Chat.
7. Verify that the group chat appears on the sidebar.

**Expected Result:**
- User A should see a warning saying "You must be friends with the <user>" when they try to create a group chat user who is not their friend
- User A should be able to see the participants inside the group chat

- **Screenshot prompts:**
<img width="1061" height="557" alt="Screenshot 2025-11-25 at 09 37 40" src="https://github.com/user-attachments/assets/62b517a4-c154-4e28-8398-d01dff1b6ac6" />
<img width="1074" height="627" alt="Screenshot 2025-11-25 at 09 37 47" src="https://github.com/user-attachments/assets/e28a5c68-979e-46b7-954b-94dac885b71b" />

### Community Chat Feature

**Test Steps:**
1. Log in as User A.
2. Navigate to the group chats page.
3. Click on the New Group Chat button.
4. Select the Community Chat tab
5. Select a community
7. Click Create Group Chat.
8. Verify that the group chat appears on the sidebar.
9. Open another browser and sign in as User C.
10. Join the community that User A just created a chat for.
11. User C should automatically see the community chat.

**Expected Result:**
- User should be able to create a group chat with all the members in the communities
- When a user joins or leaves the community, they would also be automatically added or removed from the community chat.

- **Screenshot prompts:**
<img width="1040" height="359" alt="Screenshot 2025-11-25 at 09 45 54" src="https://github.com/user-attachments/assets/21c3e2c1-a223-4c71-b440-0e7a2a622d19" />
<img width="1062" height="611" alt="Screenshot 2025-11-25 at 09 46 02" src="https://github.com/user-attachments/assets/6f2e7feb-8eb8-452d-a1fe-32cc7173c865" />
<img width="1062" height="612" alt="Screenshot 2025-11-25 at 09 49 51" src="https://github.com/user-attachments/assets/dc4cc195-39cf-42c1-ad6e-9401f5b52826" />


### Read Receipt and Typing Indicator Feature

**Test Steps:**
1. Open one browser and log in as User A.
2. Navigate to a chat with another user, let's say User B.
3. Send a message, which would be marked as delivered
5. Open another browser and log on to User B
6. Select the chat with User A
7. Keep both browsers open
8. Go back to the browser that User A is logged into and click on the chat
9. The latest message that User A sent should be marked as Read
10. Type something in the messaging box
11. Now go back to the User B browser
12. The chat would indicate that User A is typing

**Expected Result:**
- User should be able to see the read status of their latest message
- User should be able to see typing indicator when the other User is typing, the typing indicator would go away when the user becomes inactive for 3 seconds.
- Read receipt and typing indicator should work for global chat, group chat, and direct messages

- **Screenshot prompts:**
<img width="1062" height="632" alt="Screenshot 2025-11-25 at 10 03 19" src="https://github.com/user-attachments/assets/3cb89f3d-d44f-4642-9b45-d5fa22ddf68a" />
<img width="830" height="557" alt="Screenshot 2025-11-25 at 10 11 07" src="https://github.com/user-attachments/assets/e6c90661-a08b-4354-b79e-fd0849416879" />
<img width="821" height="564" alt="Screenshot 2025-11-25 at 10 11 30" src="https://github.com/user-attachments/assets/f0ce03fa-fe44-4f86-bec0-83104543ede5" />
<img width="1020" height="598" alt="Screenshot 2025-11-25 at 10 11 45" src="https://github.com/user-attachments/assets/ffee98ed-360b-4209-97a2-ba1ad8f7c963" />

### Message Editing Functionalities

**Test Steps:**
1. Open one browser and log in as User A.
2. Navigate to a chat with another user, let's say User B.
3. Edit a message by clicking on the edit button
5. Once the edit was saved, the original version should show up in edit history
6. That message would be marked as edited.
7. Both User A and User B should be able to view the edit history by clicking on the view toggle

**Expected Result:**
- User should be able to edit their messages
- All participants in the chat should be able to see the edited label and the edit history if a message was edited

- **Screenshot prompts:**

<img width="636" height="492" alt="Screenshot 2025-11-25 at 10 17 23" src="https://github.com/user-attachments/assets/6112e885-406d-41dd-aa55-6e8304849c7f" />
<img width="678" height="376" alt="Screenshot 2025-11-25 at 10 23 37" src="https://github.com/user-attachments/assets/49c6ed9c-5520-41de-a1da-b4658b0df6ee" />

### Message Deleting Functionalities

**Test Steps:**
1. Open one browser and log in as User A.
2. Navigate to a chat with another user, let's say User B.
3. Delete a message by clicking on the delete button.
4. A modal should pop up confirming the action.
5. Confirm the action and go back to the chat 
6. Verify that the deleted message is no longer in the chat for all chat participants

**Expected Result:**
- User should be able to delete their messages
- All participants in the chat should not be able to see the deleted message

- **Screenshot prompts:**
<img width="1133" height="761" alt="Screenshot 2025-11-25 at 10 34 14" src="https://github.com/user-attachments/assets/741d18f8-6942-4359-89a9-40e085496d17" />
<img width="828" height="526" alt="Screenshot 2025-11-25 at 10 34 29" src="https://github.com/user-attachments/assets/11a23993-2976-4852-82e6-d6670deab99a" />
<img width="843" height="601" alt="Screenshot 2025-11-25 at 10 34 42" src="https://github.com/user-attachments/assets/a843a275-152c-4d6f-abd5-ffe70c18c9d7" />
