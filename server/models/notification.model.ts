import mongoose, { Model, InferSchemaType } from 'mongoose';
import notificationSchema from './schema/notification.schema';

// Infer the TS type from the schema
export type DatabaseNotification = InferSchemaType<typeof notificationSchema>;

/**
 * Mongoose model for the `Notification` collection.
 *
 * This model is created using the `DatabaseNotification` inferred interface and the
 * `notificationSchema`, representing the Notification collection in MongoDB.
 *
 * @type {Model<DatabaseNotification>}
 */
const NotificationModel: Model<DatabaseNotification> =
  mongoose.models.Notification ||
  mongoose.model<DatabaseNotification>('Notification', notificationSchema);

export default NotificationModel;
