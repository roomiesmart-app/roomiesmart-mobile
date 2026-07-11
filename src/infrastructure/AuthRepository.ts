import { fetchApi } from '../core/api';
import { UserSession } from '../core/session';

export interface KindeProfile {
  id: string;
  email: string;
  departmentId?: string | null;
}

export class AuthRepository {
  static async checkStatus(email: string): Promise<{ exists: boolean; user?: UserSession }> {
    const response = await fetchApi(`/api/v1/identity/check-status/${email}`);
    return response;
  }

  static async getMe(): Promise<KindeProfile> {
    const response = await fetchApi('/api/v1/identity/me');
    return response.data;
  }
}
