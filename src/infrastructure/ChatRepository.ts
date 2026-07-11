import { fetchApi } from '../core/api';

export class ChatRepository {
  static async getConversationsByUser(userId: string): Promise<any> {
    return await fetchApi(`/api/v1/roomies/conversations/user/${userId}`);
  }

  static async getOrCreateConversation(data: { currentUserId: string; targetUserId: string }): Promise<any> {
    return await fetchApi('/api/v1/roomies/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getMessages(conversationId: string, limit?: number): Promise<any> {
    const query = limit ? `?limit=${limit}` : '';
    return await fetchApi(`/api/v1/roomies/conversations/${conversationId}/messages${query}`);
  }

  static async sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
    return await fetchApi(`/api/v1/roomies/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderId, content })
    });
  }
}
