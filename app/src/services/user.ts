import axios from 'axios';
import { ProfileType } from '../types/ProfleType';
import { API_URL } from '../utils/urlConstants';

export async function me(): Promise<ProfileType | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/user/me`, {
      withCredentials: true
    });
    if (response.status === 200) {
      return response.data as ProfileType;
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

export async function getAllActiveProfiles(): Promise<ProfileType[] | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/user/all`);
    if (response.status === 200) {
      return response.data as ProfileType[];
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
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
      console.log(response.status);

      return response.status === 200;
    } catch (error) {
      console.log(error);
    }
  }
}
