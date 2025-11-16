import axios from 'axios';
import { UserCredentials, SafeDatabaseUser } from '../types/types';
import api from './config';

const USER_API_URL = `/api/user`;

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.get(`${USER_API_URL}/getUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging in: ${error.response.data}`);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Resets the password for a user.
 * @param username - The unique username of the user
 * @param newPassword - The new password to be set for the user
 * @returns A promise that resolves to the updated user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPassword = async (username: string, newPassword: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/resetPassword`, {
    username,
    password: newPassword,
  });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/** * Updates the user's email.
 * @param username The unique username of the user
 * @param newEmail The new email to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateEmail = async (username: string, newEmail: string): Promise<{ msg: string }> => {
  const res = await api.patch(`${USER_API_URL}/updateEmail`, { username, email: newEmail });
  if (res.status !== 200) {
    throw new Error('Error when updating email');
  }
  return res.data as { msg: string };
};

export const verifyEmail = async (token: string) => {
  const res = await api.get(`${USER_API_URL}/verifyEmail`, { params: { token } });
  const data = await res.data;
  // expected success shape: { msg: string, email?: string }
  if (res.status !== 200) {
    throw new Error(data?.error || 'Verification failed');
  }
  return data;
};

/**
 * Adds a friend for the given user.
 */
export const addFriend = async (
  username: string,
  targetUsername: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/addFriend`, { username, targetUsername });
  if (res.status !== 200) {
    throw new Error('Error when adding friend');
  }
  return res.data;
};

/**
 * Removes a friend for the given user.
 */
export const removeFriend = async (
  username: string,
  targetUsername: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/removeFriend`, { username, targetUsername });
  if (res.status !== 200) {
    throw new Error('Error when removing friend');
  }
  return res.data;
};

/**
 * Blocks the target user.
 */
export const blockUser = async (
  username: string,
  targetUsername: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/blockUser`, { username, targetUsername });
  if (res.status !== 200) {
    throw new Error('Error when blocking user');
  }
  return res.data;
};

/**
 * Unblocks the target user.
 */
export const unblockUser = async (
  username: string,
  targetUsername: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/unblockUser`, { username, targetUsername });
  if (res.status !== 200) {
    throw new Error('Error when unblocking user');
  }
  return res.data;
};

/**
 * Fetch relations for a user.
 */
export const getRelations = async (
  username: string,
): Promise<{ friends: string[]; blockedUsers: string[] }> => {
  const res = await api.get(`${USER_API_URL}/relations/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching relations');
  }
  return res.data;
};

/**
 * Requests a password reset by sending an email with a reset link.
 * @param usernameOrEmail - The username or email address of the account
 * @returns A promise that resolves to a success message
 * @throws {Error} If the request to the server is unsuccessful
 */
const forgotPassword = async (usernameOrEmail: string): Promise<{ message: string }> => {
  const res = await api.post(`${USER_API_URL}/forgotPassword`, { usernameOrEmail });
  if (res.status !== 200) {
    throw new Error('Error when requesting password reset');
  }
  return res.data;
};

/**
 * Resets password using a token from the reset email.
 * @param token - The reset token from the email
 * @param newPassword - The new password to set
 * @returns A promise that resolves to a success message
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPasswordWithToken = async (
  token: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const res = await api.post(`${USER_API_URL}/resetPasswordWithToken`, { token, newPassword });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

export {
  getUsers,
  getUserByUsername,
  loginUser,
  createUser,
  deleteUser,
  resetPassword,
  updateBiography,
  updateEmail,
  forgotPassword,
  resetPasswordWithToken,
};
