import { createContext } from 'react';
import { AnonymousUserContextType, ProfileContextType } from '../types/UserContextType';

export const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);
export const AnonymousUserContext = createContext<AnonymousUserContextType>(
  {} as AnonymousUserContextType
);
