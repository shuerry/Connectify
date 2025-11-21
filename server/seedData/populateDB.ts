import { info as logInfo, error as logError } from '../utils/logger';
import mongoose from 'mongoose';
import 'dotenv/config';

import AnswerModel from '../models/answers.model';
import CommentModel from '../models/comments.model';
import QuestionModel from '../models/questions.model';
import TagModel from '../models/tags.model';
import UserModel from '../models/users.model';
import MessageModel from '../models/messages.model';

import answersResolver from './resolvers/answer';
import questionsResolver from './resolvers/question';
import identityResolver from './resolvers/identity';

import type {
  InsertedDocs,
  ReferenceResolver,
  AnswerImport,
  QuestionImport,
  CollectionImport,
} from '../types/populate';

import { collectionDependencies } from './collectionDependencies';
import {
  DatabaseUser,
  DatabaseComment,
  DatabaseAnswer,
  DatabaseQuestion,
  DatabaseTag,
  DatabaseMessage,
  DatabaseCommunity,
  DatabaseCollection,
} from '../types/types';
import { computeImportOrder, loadJSON, processCollection } from './utils';
import type { User, Comment, Tag, Message, Community } from '../types/types';
import CommunityModel from '../models/community.model';
import CollectionModel from '../models/collection.model';
import collectionsResolver from './resolvers/collection';

// Compute the import order based on dependencies
const IMPORT_ORDER = computeImportOrder(collectionDependencies);

// collectionMapping removed: use explicit per-collection calls below for full type safety.

// (No helper) We'll handle each collection explicitly in the switch below so TypeScript
// can correctly infer the generics per collection without union-model issues.

logInfo('Using computed import order:', IMPORT_ORDER);

/**
 * Main function to populate the database with sample data.
 * Connects to MongoDB, processes collections in a specific order,
 * resolves references between documents, and inserts them.
 * @returns {Promise<void>} - A promise that resolves when database population is complete.
 * @throws {Error} - If MongoDB URI is not set or if there's an error during processing.
 */
async function main(args: string[]) {
  const mongoURL = process.env.MONGODB_URI || args[0];
  if (!mongoURL) {
    throw new Error('MONGODB_URI not set in environment variables');
  }

  if (!mongoURL.startsWith('mongodb')) {
    throw new Error('ERROR: You need to specify a valid MongoDB URL as the first argument');
  }

  await mongoose.connect(`${mongoURL}/fake_so`);

  logInfo('Connected to MongoDB');

  const insertedDocs: InsertedDocs = {};

  // Load all collections' JSON
  const loadPromises = IMPORT_ORDER.map(async collectionName => {
    const docs = await loadJSON(collectionName);
    return { collectionName, docs };
  });

  const loadedData = await Promise.all(loadPromises);
  const docsMap = new Map();
  loadedData.forEach(({ collectionName, docs }) => {
    docsMap.set(collectionName, docs);
  });

  // Loop through collections and handle each with command design pattern
  for (const collectionName of IMPORT_ORDER) {
    logInfo(`Processing ${collectionName}...`);

    insertedDocs[collectionName] = new Map();
    const docs = docsMap.get(collectionName) || {};

    switch (collectionName) {
      case 'user':
        await processCollection<User, DatabaseUser, Omit<DatabaseUser, '_id'>>(
          UserModel,
          identityResolver as ReferenceResolver<User, Omit<DatabaseUser, '_id'>>,
          docs as Record<string, User>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'comment':
        await processCollection<Comment, DatabaseComment, Omit<DatabaseComment, '_id'>>(
          CommentModel,
          identityResolver as ReferenceResolver<Comment, Omit<DatabaseComment, '_id'>>,
          docs as Record<string, Comment>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'answer':
        await processCollection<AnswerImport, DatabaseAnswer, Omit<DatabaseAnswer, '_id'>>(
          AnswerModel,
          answersResolver,
          docs as Record<string, AnswerImport>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'question':
        await processCollection<QuestionImport, DatabaseQuestion, Omit<DatabaseQuestion, '_id'>>(
          QuestionModel,
          questionsResolver,
          docs as Record<string, QuestionImport>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'tag':
        await processCollection<Tag, DatabaseTag, Omit<DatabaseTag, '_id'>>(
          TagModel,
          identityResolver as ReferenceResolver<Tag, Omit<DatabaseTag, '_id'>>,
          docs as Record<string, Tag>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'message':
        await processCollection<Message, DatabaseMessage, Omit<DatabaseMessage, '_id'>>(
          MessageModel,
          identityResolver as ReferenceResolver<Message, Omit<DatabaseMessage, '_id'>>,
          docs as Record<string, Message>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'community':
        await processCollection<Community, DatabaseCommunity, Omit<DatabaseCommunity, '_id'>>(
          CommunityModel,
          identityResolver as ReferenceResolver<Community, Omit<DatabaseCommunity, '_id'>>,
          docs as Record<string, Community>,
          insertedDocs,
          collectionName,
        );
        break;
      case 'collection':
        await processCollection<
          CollectionImport,
          DatabaseCollection,
          Omit<DatabaseCollection, '_id'>
        >(
          CollectionModel,
          collectionsResolver,
          docs as Record<string, CollectionImport>,
          insertedDocs,
          collectionName,
        );
        break;
      default:
        throw new Error(`Unknown collection: ${collectionName}`);
    }
  }

  await mongoose.disconnect();
  logInfo('\nPopulation complete. Disconnected from MongoDB.');
}

main(process.argv.slice(2)).catch(err => {
  logError('Error populating database:', err);
  process.exit(1);
});
