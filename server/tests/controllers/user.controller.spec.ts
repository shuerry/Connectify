import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import * as emailVerificationService from '../../services/emailVerification.service';
import * as passwordResetService from '../../services/passwordReset.service';
import { SafeDatabaseUser, User } from '../../types/types';

const mockUser: User = {
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
};

const mockUserJSONResponse = {
  _id: mockSafeUser._id.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const getUsersListSpy = jest.spyOn(util, 'getUsersList');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');
const addFriendSpy = jest.spyOn(util, 'addFriend');
const removeFriendSpy = jest.spyOn(util, 'removeFriend');
const blockUserSpy = jest.spyOn(util, 'blockUser');
const unblockUserSpy = jest.spyOn(util, 'unblockUser');
const getRelationsSpy = jest.spyOn(util, 'getRelations');
const toggleOnlineStatusSpy = jest.spyOn(util, 'toggleOnlineStatusVisibility');
const getOnlineStatusSpy = jest.spyOn(util, 'getOnlineStatus');

const startEmailVerificationSpy = jest.spyOn(emailVerificationService, 'startEmailVerification');
const confirmEmailVerificationSpy = jest.spyOn(
  emailVerificationService,
  'confirmEmailVerification',
);
const requestPasswordResetSpy = jest.spyOn(passwordResetService, 'requestPasswordReset');
const confirmPasswordResetSpy = jest.spyOn(passwordResetService, 'confirmPasswordReset');

describe('Test userController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
        biography: 'This is a test biography',
      };

      saveUserSpy.mockResolvedValueOnce({ ...mockSafeUser, biography: mockReqBody.biography });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse, biography: mockReqBody.biography });
      expect(saveUserSpy).toHaveBeenCalledWith({
        ...mockReqBody,
        biography: mockReqBody.biography,
        dateJoined: expect.any(Date),
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'Error saving user' });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while authenticating', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce({ error: 'Error authenticating user' });

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Login failed');
    });
  });

  describe('PATCH /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while updating', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating user password');
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/api/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error finding user' });

      const response = await supertest(app).get(`/api/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when getting user by username');
    });

    it('should return 404 if username not provided', async () => {
      const response = await supertest(app).get('/api/user/getUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /getUsers', () => {
    it('should return the users from the database', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      const response = await supertest(app).get(`/api/user/getUsers`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockUserJSONResponse]);
      expect(getUsersListSpy).toHaveBeenCalled();
    });

    it('should return 500 if database error while finding users', async () => {
      getUsersListSpy.mockResolvedValueOnce({ error: 'Error finding users' });

      const response = await supertest(app).get(`/api/user/getUsers`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when getting users');
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(`/api/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error deleting user' });

      const response = await supertest(app).delete(`/api/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when deleting user by username');
    });

    it('should return 404 if username not provided', async () => {
      const response = await supertest(app).delete('/api/user/deleteUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /updateBiography', () => {
    it('should successfully update biography given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'This is my new bio',
      };

      updatedUserSpy.mockResolvedValueOnce({ ...mockSafeUser, biography: mockReqBody.biography });

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUserJSONResponse,
        biography: mockReqBody.biography,
      });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        biography: 'This is my new bio',
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        biography: 'some new biography',
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        biography: 'a new bio',
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing biography field', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/biography');
    });

    it('should return 500 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'Attempting update biography',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when updating user biography: Error: Error updating user',
      );
    });
  });

  describe('PATCH /updateEmail', () => {
    it('should start email verification and return 200', async () => {
      const body = { username: 'user1', email: 'user1@example.com' };

      startEmailVerificationSpy.mockResolvedValueOnce({ ok: true } as any);

      const res = await supertest(app).patch('/api/user/updateEmail').send(body);

      expect(res.status).toBe(200);
      expect(startEmailVerificationSpy).toHaveBeenCalledWith('user1', 'user1@example.com');
      expect(res.body.msg).toContain('Verification email sent');
    });

    it('should return 500 when startEmailVerification returns an error', async () => {
      const body = { username: 'user1', email: 'user1@example.com' };

      startEmailVerificationSpy.mockResolvedValueOnce({ error: 'bad email' } as any);

      const res = await supertest(app).patch('/api/user/updateEmail').send(body);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when updating user email');
    });
  });

  describe('GET /verifyEmail & POST /verifyEmail', () => {
    it('should return 400 if token is missing', async () => {
      const resGet = await supertest(app).get('/api/user/verifyEmail');
      expect(resGet.status).toBe(400);
      expect(resGet.body).toEqual({ error: 'Missing token' });

      const resPost = await supertest(app).post('/api/user/verifyEmail').send({});
      expect(resPost.status).toBe(400);
      expect(resPost.body).toEqual({ error: 'Missing token' });
    });

    it('should return 400 if confirmEmailVerification returns an error', async () => {
      confirmEmailVerificationSpy.mockResolvedValueOnce({ error: 'Invalid token' } as any);

      const res = await supertest(app).get('/api/user/verifyEmail').query({ token: 'bad-token' });

      expect(confirmEmailVerificationSpy).toHaveBeenCalledWith('bad-token');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid token' });
    });

    it('should verify email, fetch updated user and return 200', async () => {
      confirmEmailVerificationSpy.mockResolvedValueOnce({
        email: 'user1@example.com',
        username: 'user1',
      } as any);

      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const res = await supertest(app).post('/api/user/verifyEmail').send({ token: 'good-token' });

      expect(confirmEmailVerificationSpy).toHaveBeenCalledWith('good-token');
      expect(getUserByUsernameSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        msg: 'Email verified successfully',
        email: 'user1@example.com',
      });
    });

    it('should handle case where fetching updated user fails and still return 200', async () => {
      confirmEmailVerificationSpy.mockResolvedValueOnce({
        email: 'user1@example.com',
        username: 'user1',
      } as any);

      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'db error' } as any);

      const res = await supertest(app)
        .get('/api/user/verifyEmail')
        .query({ token: 'good-token-2' });

      expect(confirmEmailVerificationSpy).toHaveBeenCalledWith('good-token-2');
      expect(getUserByUsernameSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('user1@example.com');
    });

    it('should return 500 when confirmEmailVerification throws', async () => {
      confirmEmailVerificationSpy.mockRejectedValueOnce(new Error('boom'));

      const res = await supertest(app).get('/api/user/verifyEmail').query({ token: 'tok' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to verify email' });
    });
  });

  describe('Online status routes', () => {
    it('POST /toggleOnlineStatus should toggle visibility and return 200', async () => {
      toggleOnlineStatusSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        showOnlineStatus: false,
        friends: [],
      } as any);

      const res = await supertest(app)
        .post('/api/user/toggleOnlineStatus')
        .send({ username: 'user1' });

      expect(toggleOnlineStatusSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body.showOnlineStatus).toBe(false);
    });

    it('POST /toggleOnlineStatus should return 500 on service error', async () => {
      toggleOnlineStatusSpy.mockResolvedValueOnce({ error: 'failed' } as any);

      const res = await supertest(app)
        .post('/api/user/toggleOnlineStatus')
        .send({ username: 'user1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when toggling online status');
    });

    it('GET /onlineStatus/:username should return status object', async () => {
      getOnlineStatusSpy.mockResolvedValueOnce({ isOnline: true, showOnlineStatus: false });

      const res = await supertest(app).get('/api/user/onlineStatus/user1');

      expect(getOnlineStatusSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ isOnline: true, showOnlineStatus: false });
    });

    it('GET /onlineStatus/:username should return 500 on error', async () => {
      getOnlineStatusSpy.mockResolvedValueOnce({ error: 'boom' });

      const res = await supertest(app).get('/api/user/onlineStatus/user1');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting online status');
    });
  });

  describe('friend / block / unblock / relations routes', () => {
    it('POST /addFriend should add friend and return 200', async () => {
      addFriendSpy.mockResolvedValueOnce({ ...mockSafeUser, friends: ['friend1'] } as any);

      const res = await supertest(app)
        .post('/api/user/addFriend')
        .send({ username: 'user1', targetUsername: 'friend1' });

      expect(res.status).toBe(200);
      expect(addFriendSpy).toHaveBeenCalledWith('user1', 'friend1');
      expect(res.body.username).toBe('user1');
    });

    it('POST /addFriend should return 500 on error', async () => {
      addFriendSpy.mockResolvedValueOnce({ error: 'Error when adding friend' } as any);

      const res = await supertest(app)
        .post('/api/user/addFriend')
        .send({ username: 'user1', targetUsername: 'friend1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when adding friend');
    });

    it('POST /removeFriend should remove friend and return 200', async () => {
      removeFriendSpy.mockResolvedValueOnce({ ...mockSafeUser, friends: [] } as any);

      const res = await supertest(app)
        .post('/api/user/removeFriend')
        .send({ username: 'user1', targetUsername: 'friend1' });

      expect(res.status).toBe(200);
      expect(removeFriendSpy).toHaveBeenCalledWith('user1', 'friend1');
      expect(res.body.username).toBe('user1');
    });

    it('POST /removeFriend should return 500 on error', async () => {
      removeFriendSpy.mockResolvedValueOnce({ error: 'Error when removing friend' } as any);

      const res = await supertest(app)
        .post('/api/user/removeFriend')
        .send({ username: 'user1', targetUsername: 'friend1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when removing friend');
    });

    it('POST /blockUser should block target user and return 200', async () => {
      blockUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        blockedUsers: ['blocked1'],
      } as any);

      const res = await supertest(app)
        .post('/api/user/blockUser')
        .send({ username: 'user1', targetUsername: 'blocked1' });

      expect(res.status).toBe(200);
      expect(blockUserSpy).toHaveBeenCalledWith('user1', 'blocked1');
      expect(res.body.username).toBe('user1');
    });

    it('POST /blockUser should return 500 on error', async () => {
      blockUserSpy.mockResolvedValueOnce({ error: 'Error when blocking user' } as any);

      const res = await supertest(app)
        .post('/api/user/blockUser')
        .send({ username: 'user1', targetUsername: 'blocked1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when blocking user');
    });

    it('POST /unblockUser should unblock target user and return 200', async () => {
      unblockUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        blockedUsers: [],
      } as any);

      const res = await supertest(app)
        .post('/api/user/unblockUser')
        .send({ username: 'user1', targetUsername: 'blocked1' });

      expect(res.status).toBe(200);
      expect(unblockUserSpy).toHaveBeenCalledWith('user1', 'blocked1');
    });

    it('POST /unblockUser should return 500 on error', async () => {
      unblockUserSpy.mockResolvedValueOnce({ error: 'Error when unblocking user' } as any);

      const res = await supertest(app)
        .post('/api/user/unblockUser')
        .send({ username: 'user1', targetUsername: 'blocked1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when unblocking user');
    });

    it('GET /relations/:username should return relations on success', async () => {
      getRelationsSpy.mockResolvedValueOnce({
        friends: ['friend1'],
        blockedUsers: ['blocked1'],
      });

      const res = await supertest(app).get('/api/user/relations/user1');

      expect(getRelationsSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body.friends).toEqual(['friend1']);
    });

    it('GET /relations/:username should return 500 on error', async () => {
      getRelationsSpy.mockResolvedValueOnce({ error: 'Error getting relations' });

      const res = await supertest(app).get('/api/user/relations/user1');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting relations');
    });
  });

  describe('forgot / reset password with token', () => {
    it('POST /forgotPassword should call requestPasswordReset and return 200', async () => {
      requestPasswordResetSpy.mockResolvedValueOnce(undefined as any);

      const res = await supertest(app)
        .post('/api/user/forgotPassword')
        .send({ usernameOrEmail: 'user1' });

      expect(requestPasswordResetSpy).toHaveBeenCalledWith('user1');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('password reset email has been sent');
    });

    it('POST /forgotPassword should return 500 when requestPasswordReset throws', async () => {
      requestPasswordResetSpy.mockRejectedValueOnce(new Error('boom'));

      const res = await supertest(app)
        .post('/api/user/forgotPassword')
        .send({ usernameOrEmail: 'user1' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when requesting password reset');
    });

    it('POST /resetPasswordWithToken should return 400 if confirmPasswordReset returns error', async () => {
      confirmPasswordResetSpy.mockResolvedValueOnce({ error: 'Invalid or expired token' } as any);

      const res = await supertest(app)
        .post('/api/user/resetPasswordWithToken')
        .send({ token: 'bad', newPassword: 'newPass' });

      expect(confirmPasswordResetSpy).toHaveBeenCalledWith('bad', 'newPass');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid or expired token');
    });

    it('POST /resetPasswordWithToken should return 200 on success', async () => {
      confirmPasswordResetSpy.mockResolvedValueOnce({ ok: true } as any);

      const res = await supertest(app)
        .post('/api/user/resetPasswordWithToken')
        .send({ token: 'good', newPassword: 'newPass' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset successful.');
    });

    it('POST /resetPasswordWithToken should return 500 when confirmPasswordReset throws', async () => {
      confirmPasswordResetSpy.mockRejectedValueOnce(new Error('boom'));

      const res = await supertest(app)
        .post('/api/user/resetPasswordWithToken')
        .send({ token: 't', newPassword: 'newPass' });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when resetting password');
    });
  });
});
