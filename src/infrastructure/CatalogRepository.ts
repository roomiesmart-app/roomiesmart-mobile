import { fetchApi } from '../core/api';

export interface CatalogItem {
  id: string;
  name: string;
}

export class CatalogRepository {
  static async getCities(): Promise<CatalogItem[]> {
    const response = await fetchApi('/api/v1/catalogs/cities');
    return response.data || [];
  }

  static async getCommonAreas(): Promise<CatalogItem[]> {
    const response = await fetchApi('/api/v1/catalogs/common-areas');
    return response.data || [];
  }

  static async getAmenities(): Promise<CatalogItem[]> {
    const response = await fetchApi('/api/v1/catalogs/amenities');
    return response.data || [];
  }
}
