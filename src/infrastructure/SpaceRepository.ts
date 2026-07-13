import { fetchApi } from '../core/api';

export interface PublishedSpace {
  id: string;
  title: string;
  description: string;
  monthlyPrice: number;
  neighborhood: string;
  spaceType: string;
  images: string[];
  owner_id: string;
  owner_name?: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  users?: { id: string; email: string };
}

export interface DepartmentMembersInfo {
  members: DepartmentMember[];
  count: number;
  sharedFinancesEnabled: boolean;
}

export class SpaceRepository {
  static async getSpaces(): Promise<PublishedSpace[]> {
    const response = await fetchApi('/api/v1/roomies/spaces');
    return response.data || [];
  }

  static async requestToJoin(spaceId: string, requesterId: string): Promise<any> {
    return await fetchApi(`/api/v1/roomies/spaces/${spaceId}/requests`, {
      method: 'POST',
      body: JSON.stringify({ requesterId })
    });
  }

  static async publishSpace(spaceData: any): Promise<any> {
    return await fetchApi('/api/v1/roomies/spaces', {
      method: 'POST',
      body: JSON.stringify(spaceData)
    });
  }

  static async getRequests(ownerId: string): Promise<any> {
    return await fetchApi(`/api/v1/roomies/requests?ownerId=${ownerId}`);
  }

  static async resolveRequest(requestId: string, resolverId: string, action: 'accept' | 'reject'): Promise<any> {
    return await fetchApi(`/api/v1/roomies/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ resolverId, action })
    });
  }

  static async getUserDepartments(userId: string): Promise<PublishedSpace[]> {
    const response = await fetchApi(`/api/v1/roomies/users/${userId}/departments`);
    return response.data || [];
  }

  static async getDepartmentMembers(departmentId: string): Promise<DepartmentMembersInfo> {
    return await fetchApi(`/api/v1/roomies/departments/${departmentId}/members`);
  }
}
