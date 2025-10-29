import UserModel from '../models/users.model';
import {
  DatabaseUser,
  SafeDatabaseUser,
  User,
  UserCredentials,
  UserResponse,
  UsersResponse,
} from '../types/types';

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    const result: DatabaseUser = await UserModel.create(user);

    if (!result) {
      throw Error('Failed to create user');
    }

    // Remove password field from returned object
    const safeUser: SafeDatabaseUser = {
      _id: result._id,
      username: result.username,
      dateJoined: result.dateJoined,
      biography: result.biography,
      friends: result.friends,
      blockedUsers: result.blockedUsers,
    };

    return safeUser;
  } catch (error) {
    return { error: `Error occurred when saving user: ${error}` };
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({ username }).select('-password');

    if (!user) {
      throw Error('User not found');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Retrieves all users from the database.
 * Users documents are returned in the order in which they were created, oldest to newest.
 *
 * @returns {Promise<UsersResponse>} - Resolves with the found user objects (without the passwords) or an error message.
 */
export const getUsersList = async (): Promise<UsersResponse> => {
  try {
    const users: SafeDatabaseUser[] = await UserModel.find().select('-password');

    if (!users) {
      throw Error('Users could not be retrieved');
    }

    return users;
  } catch (error) {
    return { error: `Error occurred when finding users: ${error}` };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {UserCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (loginCredentials: UserCredentials): Promise<UserResponse> => {
  const { username, password } = loginCredentials;

  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({ username, password }).select(
      '-password',
    );

    if (!user) {
      throw Error('Authentication failed');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when authenticating user: ${error}` };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const deletedUser: SafeDatabaseUser | null = await UserModel.findOneAndDelete({
      username,
    }).select('-password');

    if (!deletedUser) {
      throw Error('Error deleting user');
    }

    return deletedUser;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const updatedUser: SafeDatabaseUser | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: updates },
      { new: true },
    ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating user');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating user: ${error}` };
  }
};

/**
 * Adds a friend relation for a user.
 */
export const addFriend = async (
  username: string,
  friendUsername: string,
): Promise<UserResponse> => {
  try {
    const updated = await UserModel.findOneAndUpdate(
      { username },
      { $addToSet: { friends: friendUsername } },
      { new: true },
    )
      .select('-password');

    if (!updated) {
      throw Error('Error updating friends');
    }

    return updated;
  } catch (error) {
    return { error: `Error when adding friend: ${error}` };
  }
};

/**
 * Removes a friend relation for a user. Also removes the user from the friend's list.
 */
export const removeFriend = async (
  username: string,
  friendUsername: string,
): Promise<UserResponse> => {
  try {
    // Remove from both users' friend lists
    await UserModel.findOneAndUpdate(
      { username },
      { $pull: { friends: friendUsername } },
      { new: true },
    );
    
    await UserModel.findOneAndUpdate(
      { username: friendUsername },
      { $pull: { friends: username } },
      { new: true },
    );

    // Return the updated user
    const updated = await UserModel.findOne({ username })
      .select('-password');

    if (!updated) {
      throw Error('Error updating friends');
    }

    return updated;
  } catch (error) {
    return { error: `Error when removing friend: ${error}` };
  }
};

/**
 * Blocks a target user. Also removes them from friends if present.
 */
export const blockUser = async (
  username: string,
  targetUsername: string,
): Promise<UserResponse> => {
  try {
    const updated = await UserModel.findOneAndUpdate(
      { username },
      { $addToSet: { blockedUsers: targetUsername }, $pull: { friends: targetUsername } },
      { new: true },
    )
      .select('-password');

    if (!updated) {
      throw Error('Error blocking user');
    }

    return updated;
  } catch (error) {
    return { error: `Error when blocking user: ${error}` };
  }
};

/**
 * Unblocks a target user.
 */
export const unblockUser = async (
  username: string,
  targetUsername: string,
): Promise<UserResponse> => {
  try {
    const updated = await UserModel.findOneAndUpdate(
      { username },
      { $pull: { blockedUsers: targetUsername } },
      { new: true },
    )
      .select('-password');

    if (!updated) {
      throw Error('Error unblocking user');
    }

    return updated;
  } catch (error) {
    return { error: `Error when unblocking user: ${error}` };
  }
};

/**
 * Helper to fetch relations for a given user.
 */
export const getRelations = async (
  username: string,
): Promise<{ friends: string[]; blockedUsers: string[] } | { error: string }> => {
  try {
    const user = await UserModel.findOne({ username }).select('friends blockedUsers');
    if (!user) {
      throw Error('User not found');
    }
    return {
      friends: user.friends ?? [],
      blockedUsers: user.blockedUsers ?? [],
    };
  } catch (error) {
    return { error: `Error when fetching relations: ${error}` };
  }
};

/**
 * Returns the list of usernames who have blocked the provided username.
 */
export const getUsersWhoBlocked = async (
  username: string,
): Promise<string[] | { error: string }> => {
  try {
    const users = await UserModel.find({ blockedUsers: username }).select('username');
    return users.map(u => u.username);
  } catch (error) {
    return { error: `Error when fetching users who blocked ${username}: ${error}` };
  }
};
