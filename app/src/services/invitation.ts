import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { InvitationType } from '../types/InvitationType';

export async function getAllInvitations(): Promise<InvitationType[] | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/invitations`, {
      withCredentials: true
    });
    if (response.status === 200) {
      return response.data as InvitationType[];
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}
