import mongoose, { Query } from 'mongoose';
import UserModel from '../../models/users.model';
import {
  addFriend,
  blockUser,
  deleteUserByUsername,
  getRelations,
  getUsersList,
  getUsersWhoBlocked,
  getUserByUsername,
  loginUser,
  removeFriend,
  saveUser,
  unblockUser,
  updateUser,
} from '../../services/user.service';
import { SafeDatabaseUser, User, UserCredentials } from '../../types/types';
import { user, safeUser } from '../mockData.models';

describe('User model', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('saveUser', () => {
    it('should return the saved user', async () => {
      jest
        .spyOn(UserModel, 'create')
        .mockResolvedValueOnce({ ...user, _id: mongoose.Types.ObjectId } as unknown as ReturnType<
          typeof UserModel.create<User>
        >);

      const savedUser = (await saveUser(user)) as SafeDatabaseUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should throw an error if error when saving to database', async () => {
      jest
        .spyOn(UserModel, 'create')
        .mockImplementation(() => Promise.reject(new Error('Error saving document')));

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);
    });

    it('should return error when create returns null', async () => {
      jest.spyOn(UserModel, 'create').mockResolvedValueOnce(null as any);

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);
    });
  });
});

describe('getUserByUsername', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the matching user', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(user))
      }));
      return query;
    });

    const retrievedUser = (await getUserByUsername(user.username)) as SafeDatabaseUser;

    expect(retrievedUser.username).toEqual(user.username);
    expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the user is not found', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });

  it('should return error when findOne returns null with select', async () => {
    jest.spyOn(UserModel, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation(() => {
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => {
        throw new Error('Error finding document');
      });
      return query;
    });

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });
});

describe('getUsersList', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the users', async () => {
    jest.spyOn(UserModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve([safeUser]))
      }));
      return query;
    });

    const retrievedUsers = (await getUsersList()) as SafeDatabaseUser[];

    expect(retrievedUsers[0].username).toEqual(safeUser.username);
    expect(retrievedUsers[0].dateJoined).toEqual(safeUser.dateJoined);
  });

  it('should throw an error if the users cannot be found', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser[], typeof UserModel>);

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    jest.spyOn(UserModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => {
          throw new Error('Error finding documents');
        })
      }));
      return query;
    });

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the user if authentication succeeds', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      expect(filter.password).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve(safeUser));
      return query;
    });

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeDatabaseUser;

    expect(loggedInUser.username).toEqual(user.username);
    expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return the user if the password fails', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const credentials: UserCredentials = {
      username: user.username,
      password: 'wrongPassword',
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should return the user is not found', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const credentials: UserCredentials = {
      username: 'wrongUsername',
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should return error when findOne returns null with select in loginUser', async () => {
    jest.spyOn(UserModel, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });
});

describe('deleteUserByUsername', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the deleted user when deleted succesfully', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve(safeUser));
      return query;
    });

    const deletedUser = (await deleteUserByUsername(user.username)) as SafeDatabaseUser;

    expect(deletedUser.username).toEqual(user.username);
    expect(deletedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockResolvedValue(null);

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });

  it('should return error when findOneAndDelete returns null with select', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });

  it('should throw an error if a database error while deleting', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockImplementation(() => {
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => {
        throw new Error('Error deleting document');
      });
      return query;
    });

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });
});

describe('updateUser', () => {
  const updatedUser: User = {
    ...user,
    password: 'newPassword',
  };

  const safeUpdatedUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: user.username,
    dateJoined: user.dateJoined,
  };

  const updates: Partial<User> = {
    password: 'newPassword',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the updated user when updated succesfully', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(safeUpdatedUser))
      }));
      return query;
    });

    const result = (await updateUser(user.username, updates)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.username).toEqual(updatedUser.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result.dateJoined).toEqual(updatedUser.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should return error when findOneAndUpdate returns null with select', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should throw an error if a database error while updating', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(() => {
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => {
          throw new Error('Error updating document');
        })
      }));
      return query;
    });

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should update the biography if the user is found', async () => {
    const newBio = 'This is a new biography';
    const biographyUpdates: Partial<User> = { biography: newBio };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve({ ...safeUpdatedUser, biography: newBio }))
      }));
      return query;
    });

    const result = await updateUser(user.username, biographyUpdates);

    // Check that the result is a SafeUser and the biography got updated
    if ('username' in result) {
      expect(result.biography).toEqual(newBio);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if biography update fails because user not found', async () => {
    // Simulate user not found
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const newBio = 'No user found test';
    const biographyUpdates: Partial<User> = { biography: newBio };
    const updatedError = await updateUser(user.username, biographyUpdates);

    expect('error' in updatedError).toBe(true);
  });
});

describe('addFriend', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should add a friend successfully', async () => {
    const friendUsername = 'friend1';
    const updatedUser = {
      ...safeUser,
      friends: [friendUsername],
    };

    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
      }));
      return query;
    });

    const result = (await addFriend(user.username, friendUsername)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.friends).toContain(friendUsername);
  });

  it('should return an error if user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const result = await addFriend(user.username, 'friend1');

    expect('error' in result).toBe(true);
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await addFriend(user.username, 'friend1');

    expect('error' in result).toBe(true);
  });
});

describe('removeFriend', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should remove a friend successfully from both users', async () => {
    const friendUsername = 'friend1';
    const updatedUser = {
      ...safeUser,
      friends: [],
    };

    // Mock the first findOneAndUpdate call (removing from user's list)
    jest.spyOn(UserModel, 'findOneAndUpdate')
      .mockImplementationOnce((filter?: any) => {
        expect(filter.username).toBeDefined();
        const query: any = {};
        query.select = jest.fn().mockImplementation(() => ({
          lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
        }));
        return query;
      })
      // Mock the second findOneAndUpdate call (removing from friend's list)
      .mockImplementationOnce((filter?: any) => {
        expect(filter.username).toBeDefined();
        const query: any = {};
        query.select = jest.fn().mockImplementation(() => ({
          lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
        }));
        return query;
      });

    // Mock the findOne call (getting updated user)
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
      }));
      return query;
    });

    const result = (await removeFriend(user.username, friendUsername)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.friends).not.toContain(friendUsername);
    expect(UserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(UserModel.findOne).toHaveBeenCalledTimes(1);
  });

  it('should return an error if user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const result = await removeFriend(user.username, 'friend1');

    expect('error' in result).toBe(true);
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await removeFriend(user.username, 'friend1');

    expect('error' in result).toBe(true);
  });
});

describe('blockUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should block a user successfully', async () => {
    const targetUsername = 'blockedUser';
    const updatedUser = {
      ...safeUser,
      blockedUsers: [targetUsername],
      friends: [], // Should be removed from friends if present
    };

    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
      }));
      return query;
    });

    const result = (await blockUser(user.username, targetUsername)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.blockedUsers).toContain(targetUsername);
  });

  it('should return an error if user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const result = await blockUser(user.username, 'blockedUser');

    expect('error' in result).toBe(true);
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await blockUser(user.username, 'blockedUser');

    expect('error' in result).toBe(true);
  });
});

describe('unblockUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should unblock a user successfully', async () => {
    const targetUsername = 'blockedUser';
    const updatedUser = {
      ...safeUser,
      blockedUsers: [],
    };

    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(updatedUser))
      }));
      return query;
    });

    const result = (await unblockUser(user.username, targetUsername)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.blockedUsers).not.toContain(targetUsername);
  });

  it('should return an error if user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const result = await unblockUser(user.username, 'blockedUser');

    expect('error' in result).toBe(true);
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await unblockUser(user.username, 'blockedUser');

    expect('error' in result).toBe(true);
  });
});

describe('getRelations', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return user relations successfully', async () => {
    const userRelations = {
      friends: ['friend1', 'friend2'],
      blockedUsers: ['blocked1'],
    };

    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(userRelations))
      }));
      return query;
    });

    const result = await getRelations(user.username);

    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.friends).toEqual(['friend1', 'friend2']);
      expect(result.blockedUsers).toEqual(['blocked1']);
    }
  });

  it('should return empty arrays if no relations', async () => {
    const userRelations = {
      friends: [],
      blockedUsers: [],
    };

    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(userRelations))
      }));
      return query;
    });

    const result = await getRelations(user.username);

    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.friends).toEqual([]);
      expect(result.blockedUsers).toEqual([]);
    }
  });

  it('should return an error if user not found', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const result = await getRelations(user.username);

    expect('error' in result).toBe(true);
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await getRelations(user.username);

    expect('error' in result).toBe(true);
  });
});

describe('getUsersWhoBlocked', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return list of users who blocked the given user', async () => {
    const blockingUsers = [
      { username: 'blocker1' },
      { username: 'blocker2' },
    ];

    jest.spyOn(UserModel, 'find').mockImplementation((filter?: any) => {
      expect(filter.blockedUsers).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve(blockingUsers))
      }));
      return query;
    });

    const result = await getUsersWhoBlocked(user.username);

    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result).toEqual(['blocker1', 'blocker2']);
    }
  });

  it('should return empty array if no users blocked the given user', async () => {
    jest.spyOn(UserModel, 'find').mockImplementation((filter?: any) => {
      expect(filter.blockedUsers).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => Promise.resolve([]))
      }));
      return query;
    });

    const result = await getUsersWhoBlocked(user.username);

    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result).toEqual([]);
    }
  });

  it('should return an error if database operation fails', async () => {
    jest.spyOn(UserModel, 'find').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await getUsersWhoBlocked(user.username);

    expect('error' in result).toBe(true);
  });
});
