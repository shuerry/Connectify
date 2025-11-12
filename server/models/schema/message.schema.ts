import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Message collection.
 *
 * This schema defines the structure of a message in the database.
 * Each message includes the following fields:
 * - `msg`: The text of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time the message was sent.
 * - `type`: The type of message, either 'global', 'direct', 'friendRequest', or 'gameInvitation'.
 * - `msgTo`: The username of the recipient (for direct messages, friend requests, and game invitations).
 * - `friendRequestStatus`: The status of friend request ('pending', 'accepted', 'declined').
 * - `gameInvitation`: Game invitation details (for game invitation messages).
 */
const messageSchema: Schema = new Schema(
  {
    msg: {
      type: String,
    },
    msgFrom: {
      type: String,
    },
    msgDateTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['global', 'direct', 'friendRequest', 'gameInvitation'],
    },
    msgTo: {
      type: String,
    },
    friendRequestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
    },
    gameInvitation: {
      type: {
        gameID: {
          type: String,
          required: false,
        },
        roomName: {
          type: String,
          required: false,
        },
        roomCode: {
          type: String,
          required: false,
        },
        gameType: {
          type: String,
          enum: ['Connect Four'],
          required: false,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined', 'expired'],
          required: false,
        },
      },
      required: false,
    },
    readBy: {
      type: [String],
      default: [],
    },
  },
  { collection: 'Message' },
);

export default messageSchema;
