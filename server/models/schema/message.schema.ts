import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Message collection.
 *
 * This schema defines the structure of a message in the database.
 * Each message includes the following fields:
 * - `msg`: The text of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time the message was sent.
 * - `type`: The type of message, either 'global', 'direct', or 'friendRequest'.
 * - `msgTo`: The username of the recipient (for direct messages and friend requests).
 * - `friendRequestStatus`: The status of friend request ('pending', 'accepted', 'declined').
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
      enum: ['global', 'direct', 'friendRequest'],
    },
    msgTo: {
      type: String,
    },
    friendRequestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
    },
  },
  { collection: 'Message' },
);

export default messageSchema;
