import express, { Request, Response, Router } from 'express';
import { info as logInfo, error as logError } from '../utils/logger';
import {
  UserRequest,
  User,
  UserCredentials,
  UserByUsernameRequest,
  FakeSOSocket,
  UpdateBiographyRequest,
  UpdateEmailRequest,
} from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
  addFriend,
  removeFriend,
  blockUser,
  unblockUser,
  getRelations,
  toggleOnlineStatusVisibility,
  updateOnlineStatus,
  getOnlineStatus,
} from '../services/user.service';
import {
  confirmEmailVerification,
  startEmailVerification,
} from '../services/emailVerification.service';
import { requestPasswordReset, confirmPasswordReset } from '../services/passwordReset.service';

const userController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    const requestUser = req.body;

    const user: User = {
      ...requestUser,
      dateJoined: new Date(),
      biography: requestUser.biography ?? '',
    };

    try {
      const result = await saveUser(user);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('userUpdate', {
        user: result,
        type: 'created',
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when saving user: ${error}`);
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const loginCredentials: UserCredentials = {
        username: req.body.username,
        password: req.body.password,
      };

      const user = await loginUser(loginCredentials);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('Login failed');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await getUserByUsername(username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when getting user by username: ${error}`);
    }
  };

  /**
   * Retrieves all users from the database.
   * @param res The response, either returning the users or an error.
   * @returns A promise resolving to void.
   */
  const getUsers = async (_: Request, res: Response): Promise<void> => {
    try {
      const users = await getUsersList();

      if ('error' in users) {
        throw Error(users.error);
      }

      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(`Error when getting users: ${error}`);
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either confirming deletion or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        throw Error(deletedUser.error);
      }

      socket.emit('userUpdate', {
        user: deletedUser,
        type: 'deleted',
      });
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).send(`Error when deleting user by username: ${error}`);
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const updatedUser = await updateUser(req.body.username, { password: req.body.password });

      if ('error' in updatedUser) {
        throw Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user password: ${error}`);
    }
  };

  /**
   * Updates a user's biography.
   * @param req The request containing the username and biography in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBiography = async (req: UpdateBiographyRequest, res: Response): Promise<void> => {
    try {
      // Validate that request has username and biography
      const { username, biography } = req.body;

      // Call the same updateUser(...) service used by resetPassword
      const updatedUser = await updateUser(username, { biography });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user biography: ${error}`);
    }
  };

  /**
   * Updates a user's email.
   * @param req The request containing the username and new email in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateEmail = async (req: UpdateEmailRequest, res: Response): Promise<void> => {
    try {
      logInfo('Received updateEmail request:', req.body);

      const { username, email } = req.body;
      const r = await startEmailVerification(username, email);

      logInfo('Result from startEmailVerification:', r);

      if ('error' in r) throw new Error(r.error);
      res.status(200).json({ msg: 'Verification email sent. Please check your inbox.' });
    } catch (error) {
      logError('Error in updateEmail:', error);
      res.status(500).send(`Error when updating user email: ${error}`);
    }
  };

  const verifyEmail = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const token = (req.query.token || req.body.token) as string | undefined;
      if (!token) {
        res.status(400).json({ error: 'Missing token' });
        return;
      }

      const result = await confirmEmailVerification(token);
      if ('error' in result) {
        res.status(400).json(result);
        return;
      }

      let updatedUser;

      if ('username' in result) {
        updatedUser = await getUserByUsername(result.username);
      }

      if (updatedUser && !('error' in updatedUser)) {
        socket.emit('userUpdate', {
          user: updatedUser,
          type: 'updated',
        });
      }

      res.status(200).json({
        msg: 'Email verified successfully',
        email: result.email,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify email' });
    }
  };

  /**
   * Adds a friend to the given user.
   */
  const addFriendRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { username, targetUsername: friendUsername } = req.body as {
        username: string;
        targetUsername: string;
      };
      const result = await addFriend(username, friendUsername);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('userUpdate', { user: result, type: 'updated' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when adding friend: ${error}`);
    }
  };

  /**
   * Removes a friend from the given user.
   */
  const removeFriendRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { username, targetUsername: friendUsername } = req.body as {
        username: string;
        targetUsername: string;
      };
      const result = await removeFriend(username, friendUsername);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('userUpdate', { user: result, type: 'updated' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when removing friend: ${error}`);
    }
  };

  /**
   * Blocks a target user.
   */
  const blockUserRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { username, targetUsername } = req.body as {
        username: string;
        targetUsername: string;
      };
      const result = await blockUser(username, targetUsername);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('userUpdate', { user: result, type: 'updated' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when blocking user: ${error}`);
    }
  };

  /**
   * Unblocks a target user.
   */
  const unblockUserRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { username, targetUsername } = req.body as {
        username: string;
        targetUsername: string;
      };
      const result = await unblockUser(username, targetUsername);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('userUpdate', { user: result, type: 'updated' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when unblocking user: ${error}`);
    }
  };

  /**
   * Gets friends and blocked users for a username.
   */
  const getRelationsRoute = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const result = await getRelations(username);
      if ('error' in result) {
        throw new Error(result.error);
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when getting relations: ${error}`);
    }
  };

  /**
   * Initiates password reset by sending an email with a reset token.
   */
  const forgotPassword = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { usernameOrEmail } = req.body as { usernameOrEmail: string };
      await requestPasswordReset(usernameOrEmail);
      res
        .status(200)
        .json({ message: 'If an account exists, a password reset email has been sent.' });
    } catch (error) {
      res.status(500).send(`Error when requesting password reset: ${error}`);
    }
  };

  /**
   * Confirms password reset using a token and sets the new password.
   */
  const resetPasswordWithToken = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body as { token: string; newPassword: string };
      const result = await confirmPasswordReset(token, newPassword);
      if ('error' in result) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
      res.status(500).send(`Error when resetting password: ${error}`);
    }
  };

  /**
   * Toggles the user's online status visibility preference.
   */
  const toggleOnlineStatusRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { username } = req.body as { username: string };
      const result = await toggleOnlineStatusVisibility(username);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('userUpdate', { user: result, type: 'updated' });
      // Notify friends about status change
      const payload = {
        username: result.username,
        isOnline: result.isOnline ?? false,
        showOnlineStatus: result.showOnlineStatus ?? true,
      };
      socket.emit('userStatusUpdate', payload);
      if (result.friends && result.friends.length > 0) {
        result.friends.forEach(friendUsername => {
          socket.to(`user:${friendUsername}`).emit('userStatusUpdate', payload);
        });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when toggling online status: ${error}`);
    }
  };

  /**
   * Gets the online status for a user.
   */
  const getOnlineStatusRoute = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const result = await getOnlineStatus(username);
      if ('error' in result) {
        throw new Error(result.error);
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when getting online status: ${error}`);
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser);
  router.post('/login', userLogin);
  router.patch('/resetPassword', resetPassword);
  router.get('/getUser/:username', getUser);
  router.get('/getUsers', getUsers);
  router.delete('/deleteUser/:username', deleteUser);
  router.patch('/updateBiography', updateBiography);
  router.patch('/updateEmail', updateEmail);
  router.post('/addFriend', addFriendRoute);
  router.post('/removeFriend', removeFriendRoute);
  router.post('/blockUser', blockUserRoute);
  router.post('/unblockUser', unblockUserRoute);
  router.get('/relations/:username', getRelationsRoute);
  router.patch('/updateEmail', updateEmail);
  router.post('/verifyEmail', verifyEmail);
  router.get('/verifyEmail', verifyEmail);
  router.post('/forgotPassword', forgotPassword);
  router.post('/resetPasswordWithToken', resetPasswordWithToken);
  router.post('/toggleOnlineStatus', toggleOnlineStatusRoute);
  router.get('/onlineStatus/:username', getOnlineStatusRoute);
  return router;
};

export default userController;
