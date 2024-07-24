import '@farcaster/auth-kit/styles.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import Login from './Login';
import axios, { AxiosError } from 'axios';
import { ProfileType } from '../types/ProfleType';
import { me } from '../services/user';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { AuthenticationStatus } from '../components/cards/ConnectCard';
import { usePrivy } from '@privy-io/react-auth';
import CenteredCircularProgress from '../components/CenteredCircularProgress';

export default function LoginWithProviders() {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('loading');
  const [profile, setProfile] = useState<ProfileType>();
  const { ready } = usePrivy();

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const profile = await me();

        setAuthStatus(profile ? 'authenticated' : 'unauthenticated');
        setProfile(profile);
      } catch (error: any | AxiosError) {
        if (axios.isAxiosError(error)) {
          toast.error(`${error.message} 🤷🏻‍♂️`);
        }
        console.error(error);
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    // 1. page loads
    fetchStatus();

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  // 3. in case successfully authenticated, fetch currently authenticated user
  useMemo(async () => {
    if (authStatus === 'authenticated' && !profile) {
      try {
        const response = await axios.get(`${API_URL}/api/user/me`, { withCredentials: true });
        if (Boolean(response.status === 200)) {
          const authAccount = response.data;
          setProfile(authAccount);
        }
      } catch (_error) {
        setAuthStatus('unauthenticated');
      }
    }
  }, [authStatus, profile]);

  return !ready ? (
    <CenteredCircularProgress />
  ) : (
    <Login authStatus={authStatus} profile={profile} />
  );
}
