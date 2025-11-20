import { PopulatedDatabaseAnswer } from './answer';
import { PopulatedDatabaseChat } from './chat';
import { DatabaseMessage } from './message';
import { PopulatedDatabaseQuestion } from './question';
import { SafeDatabaseUser } from './user';
import { BaseMove, GameInstance, GameInstanceID, GameMove, GameState } from './game';
import { DatabaseCommunity } from './community';
import { PopulatedDatabaseCollection } from './collection';
import { NotificationPayload } from './notification';

/**
 * Payload for an answer update event.
 * - `qid`: The unique identifier of the question.
 * - `answer`: The updated answer.
 */
export interface AnswerUpdatePayload {
  qid: ObjectId;
  answer: PopulatedDatabaseAnswer;
}

/**
 * Payload for a game state update event.
 * - `gameInstance`: The updated instance of the game.
 */
export interface GameUpdatePayload {
  gameInstance: GameInstance<GameState>;
}

/**
 * Payload for a game operation error event.
 * - `player`: The player ID who caused the error.
 * - `error`: The error message.
 */
export interface GameErrorPayload {
  player: string;
  error: string;
}

/**
 * Payload for a vote update event.
 * - `qid`: The unique identifier of the question.
 * - `upVotes`: An array of usernames who upvoted the question.
 * - `downVotes`: An array of usernames who downvoted the question.
 */
export interface VoteUpdatePayload {
  qid: string;
  upVotes: string[];
  downVotes: string[];
}

/**
 * Payload for a chat update event.
 * - `chat`: The updated chat object.
 * - `type`: The type of update (`'created'`, `'newMessage'`, or `'newParticipant'`).
 */
export interface ChatUpdatePayload {
  chat: PopulatedDatabaseChat;
  type: 'created' | 'newMessage' | 'newParticipant' | 'readReceipt';
}

/**
 * Payload for a comment update event.
 * - `result`: The updated question or answer.
 * - `type`: The type of the updated item (`'question'` or `'answer'`).
 */
export interface CommentUpdatePayload {
  result: PopulatedDatabaseQuestion | PopulatedDatabaseAnswer;
  type: 'question' | 'answer';
}

/**
 * Payload for a message update event.
 * - `msg`: The updated message.
 */
export interface MessageUpdatePayload {
  msg: DatabaseMessage;
}

/**
 * Payload for a user update event.
 * - `user`: The updated user object.
 * - `type`: The type of modification (`'created'`, `'deleted'`, or `'updated'`).
 */
export interface UserUpdatePayload {
  user: SafeDatabaseUser;
  type: 'created' | 'deleted' | 'updated';
}

/**
 * Interface representing the payload for a game move operation, which contains:
 * - `gameID`: The ID of the game being played.
 * - `move`: The move being made in the game, defined by `GameMove`.
 */
export interface GameMovePayload {
  gameID: GameInstanceID;
  move: GameMove<BaseMove>;
}

/**
 * Interface representing the payload for a community update event.
 * - `type`: The type of update (`'created'`, `'updated'`, or `'deleted'`).
 * - `community`: The updated community object.
 */
export interface CommunityUpdatePayload {
  type: 'created' | 'updated' | 'deleted';
  community: DatabaseCommunity;
}

/**
 * Interface representing the payload for a collection update event.
 * - `type`: The type of update (`'created'`, `'updated'`, or `'deleted'`).
 * - `collection`: The updated collection object.
 */
export interface CollectionUpdatePayload {
  type: 'created' | 'updated' | 'deleted';
  collection: PopulatedDatabaseCollection;
}

export interface NotificationUpdatePayload {
  type: 'chat' | 'answer';
}

/**
 * Payload for a player disconnect event during a game.
 * - `disconnectedPlayer`: The player ID who disconnected.
 * - `message`: A message about the disconnection.
 */
export interface PlayerDisconnectedPayload {
  disconnectedPlayer: string;
  message: string;
}

/**
 * Payload for a game invitation event.
 * - `gameID`: The ID of the game being invited to.
 * - `roomName`: The name of the game room.
 * - `inviterUsername`: The username of the player sending the invitation.
 * - `roomCode`: The room code for joining the game.
 */
export interface GameInvitationPayload {
  gameID: GameInstanceID;
  roomName: string;
  inviterUsername: string;
  roomCode?: string;
}

/**
 * Payload for a typing indicator event.
 * - `username`: The username of the user who is typing.
 * - `chatID`: The chat ID where typing is happening (optional for global chat).
 * - `isTyping`: Whether the user is typing or stopped typing.
 */
export interface TypingIndicatorPayload {
  username: string;
  chatID?: string;
  isTyping: boolean;
}

/**
 * Interface representing the events the client can emit to the server.
 * - `makeMove`: Client can emit a move in the game.
 * - `joinGame`: Client can join a game.
 * - `leaveGame`: Client can leave a game.
 * - `joinChat`: Client can join a chat.
 * - `leaveChat`: Client can leave a chat.
 */
export interface ClientToServerEvents {
  makeMove: (move: GameMovePayload) => void;
  joinGame: (gameID: string) => void;
  leaveGame: (data: { gameID: string; playerID: string; isSpectator?: boolean }) => void;
  joinChat: (chatID: string) => void;
  leaveChat: (chatID: string | undefined) => void;
  // Request the server to emit the latest public Connect Four rooms list
  requestConnectFourRooms: () => void;
  // Register this socket's presence for auto-cleanup on disconnect
  registerPresence: (data: {
    gameID: GameInstanceID;
    playerID: string;
    isSpectator?: boolean;
  }) => void;
  // Join user-specific room for notifications
  joinUserRoom: (username: string) => void;
  leaveUserRoom: (username: string) => void;
  // Typing indicator events
  typingStart: (data: { chatID?: string; username: string }) => void;
  typingStop: (data: { chatID?: string; username: string }) => void;
}

/**
 * Interface representing the events the server can emit to the client.
 * - `questionUpdate`: Server sends updated question.
 * - `answerUpdate`: Server sends updated answer.
 * - `viewsUpdate`: Server sends updated views count for a question.
 * - `voteUpdate`: Server sends updated votes for a question.
 * - `commentUpdate`: Server sends updated comment for a question or answer.
 * - `messageUpdate`: Server sends updated message.
 * - `userUpdate`: Server sends updated user status.
 * - `gameUpdate`: Server sends updated game state.
 * - `gameError`: Server sends error message related to game operation.
 * - `chatUpdate`: Server sends updated chat.
 * - `communityUpdate`: Server sends updated community.
 * - `collectionUpdate`: Server sends updated collection.
 * - `notificationUpdate`: Server sends notification update for user-specific room.
 */
export interface ServerToClientEvents {
  questionUpdate: (question: PopulatedDatabaseQuestion) => void;
  answerUpdate: (result: AnswerUpdatePayload) => void;
  viewsUpdate: (question: PopulatedDatabaseQuestion) => void;
  voteUpdate: (vote: VoteUpdatePayload) => void;
  commentUpdate: (comment: CommentUpdatePayload) => void;
  messageUpdate: (message: MessageUpdatePayload) => void;
  userUpdate: (user: UserUpdatePayload) => void;
  gameUpdate: (game: GameUpdatePayload) => void;
  gameError: (error: GameErrorPayload) => void;
  chatUpdate: (chat: ChatUpdatePayload) => void;
  communityUpdate: (community: CommunityUpdatePayload) => void;
  collectionUpdate: (community: CollectionUpdatePayload) => void;
  // Broadcast updated list of public Connect Four rooms
  connectFourRoomsUpdate: (rooms: GameInstance<GameState>[]) => void;
  // Notify clients when a player disconnects during a game
  playerDisconnected: (payload: PlayerDisconnectedPayload) => void;
  // Send game invitation to specific users
  gameInvitation: (payload: GameInvitationPayload) => void;
  // Typing indicator events
  typingIndicator: (payload: TypingIndicatorPayload) => void;
  // Notify clients that a question was deleted. Payload contains the question id.
  questionDelete: (payload: { qid: ObjectId }) => void;
  // Notify clients that an answer was deleted. Payload contains question and answer ids.
  answerDelete: (payload: { qid: ObjectId; aid: ObjectId }) => void;
  // Notify clients that a comment was deleted. Payload contains the parent id and comment id.
  commentDelete: (payload: { parentId: ObjectId; cid: ObjectId }) => void;
  // Send notification update (for user-specific room)
  notificationUpdate: () => void;
}
