import { createContext } from 'react';
import { ProfileContextType } from '../types/UserContextType';

export const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);
