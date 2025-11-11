import { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: { type: String, index: true, required: true }, // username
    kind: { type: String, enum: ['answer', 'chat', 'system'], required: true },
    title: { type: String },
    preview: { type: String },
    link: { type: String }, // e.g. /question/:id or /chat/:id
    actorUsername: { type: String }, // who triggered the event
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    meta: { type: Schema.Types.Mixed }, // { questionId, chatId, ... }
  },
  { collection: 'Notification', timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default notificationSchema;
