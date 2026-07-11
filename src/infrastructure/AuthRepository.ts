import { fetchApi } from '../core/api';
import { UserSession } from '../core/session';

export class AuthRepository {
  static async checkStatus(email: string): Promise<{ exists: boolean; user?: UserSession }> {
    const response = await fetchApi(`/api/v1/identity/check-status/${email}`);
    return response;
  }
}
