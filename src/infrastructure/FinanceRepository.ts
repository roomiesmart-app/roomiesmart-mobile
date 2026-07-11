import { fetchApi } from '../core/api';

export class FinanceRepository {
  static async getExpenses(departmentId: string): Promise<any> {
    return await fetchApi(`/api/expenses/${departmentId}`);
  }

  static async addExpense(data: any): Promise<any> {
    return await fetchApi('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
