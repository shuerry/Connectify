import { createContext } from 'react';
import { SafeDatabaseUser } from '../types/types';

/**
 * Interface representing the context type for user login management.
 *
 * - setUser - A function to update the current user in the context,
 *             which take User object representing the logged-in user or null
 *             to indicate no user is logged in.
 * - logout - A function to log out the user and clear any remembered session.
 */
export interface LoginContextType {
  setUser: (user: SafeDatabaseUser | null) => void;
  logout: () => void;
}

const LoginContext = createContext<LoginContextType | null>(null);

export default LoginContext;
