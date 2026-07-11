import { fetchApi } from '../core/api';

export class MatchmakingRepository {
  static async getProfiles(data: any): Promise<any> {
    return await fetchApi('/api/v1/identity/matchmaking-profiles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
