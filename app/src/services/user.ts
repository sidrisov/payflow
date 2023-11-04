import axios from 'axios';
import { ProfileType } from '../types/ProfleType';

export async function me(): Promise<ProfileType | undefined> {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/user/me`,
      {
        withCredentials: true
      }
    );
    if (response.status === 200) {
      return response.data as ProfileType;
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

export async function updateUsername(username: string): Promise<boolean | undefined> {
  if (username) {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/user/me`,
        username,

        {
          headers: {
            'Content-Type': 'application/text'
          },
          withCredentials: true
        }
      );
      console.log(response.status);

      return response.status === 200;
    } catch (error) {
      console.log(error);
    }
  }
}
