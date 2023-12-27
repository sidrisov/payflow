import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { API_URL } from '../utils/urlConstants';
import { Address } from 'viem';
import { sortAndFilterFlowWallets } from '../utils/sortAndFilterFlows';

export async function me(): Promise<ProfileType | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/user/me`, {
      withCredentials: true
    });
    if (response.status === 200) {
      return response.data as ProfileType;
    }
    console.debug(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response || error.response.status !== 401) {
        throw error;
      }
    }
  }
}

export async function getAllActiveProfiles(): Promise<ProfileType[] | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/user/all`);
    if (response.status === 200) {
      return response.data as ProfileType[];
    }
    console.debug(response.data);
  } catch (error) {
    console.error(error);
  }
}

export async function searchByListOfAddressesOrUsernames(searchParams: string[]) {
  const response = await axios.get(`${API_URL}/api/user`, {
    params: { search: searchParams },
    paramsSerializer: {
      indexes: null
    }
  });
  return (response.data as ProfileType[]).map((profile) => {
    const defaultFlow = profile.defaultFlow
      ? sortAndFilterFlowWallets(profile.defaultFlow)
      : undefined;
    return {
      ...profile,
      defaultFlow
    };
  });
}

export async function getProfileByAddressOrName(addressOrName: Address | string) {
  const response = await axios.get(`${API_URL}/api/user/${addressOrName}`, {
    withCredentials: true
  });

  const profile = response.data as ProfileType;
  if (!profile) {
    return;
  }

  const defaultFlow = profile.defaultFlow
    ? sortAndFilterFlowWallets(profile.defaultFlow)
    : undefined;
  return {
    ...profile,
    defaultFlow
  };
}

export async function updateProfile(
  profile: ProfileType,
  code?: string
): Promise<boolean | undefined> {
  if (profile) {
    try {
      console.log(code);
      const response = await axios.post(`${API_URL}/api/user/me`, profile, {
        params: {
          code: code
        },
        withCredentials: true
      });
      console.debug(response.status);

      return response.status === 200;
    } catch (error) {
      console.error(error);
    }
  }
}
