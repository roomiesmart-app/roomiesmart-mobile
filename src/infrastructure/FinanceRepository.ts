import { fetchApi } from '../core/api';

export class FinanceRepository {
  static async getExpenses(departmentId: string): Promise<any> {
    return await fetchApi(`/api/expenses/${departmentId}`);
  }

  static async addExpense(data: {
    departmentId: string;
    payerId: string;
    amount: number;
    description: string;
    participants: string[];
  }): Promise<any> {
    return await fetchApi('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async payShare(expenseId: string, userId: string): Promise<any> {
    return await fetchApi(`/api/expenses/${expenseId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  static async sendReminder(payload: {
    debtorId: string;
    creditorName: string;
    amount: number;
    items?: string[];
  }): Promise<any> {
    return await fetchApi('/api/expenses/reminders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}
