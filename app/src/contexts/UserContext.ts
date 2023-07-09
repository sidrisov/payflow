import { createContext } from 'react';
import { UserContextType } from '../types/UserContextType';

export const UserContext = createContext<UserContextType>({} as UserContextType);
