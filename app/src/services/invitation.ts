import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { IdentityInvitedStatusType, InvitationType } from '../types/InvitationType';
import { Address } from 'viem';

export async function getAllInvitations(): Promise<InvitationType[] | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/invitations`, {
      withCredentials: true
    });
    if (response.status === 200) {
      return response.data as InvitationType[];
    }
    console.debug(response.data);
  } catch (error) {
    console.error(error);
  }
}

export async function identitiesInvited(identities: Address[], accessToken?: string) {
  const response = await axios.get(`${API_URL}/api/invitations/identity`, {
    params: { identities: identities, access_token: accessToken },
    paramsSerializer: {
      indexes: null
    },
    withCredentials: true
  });
  return response.data as IdentityInvitedStatusType;
}
