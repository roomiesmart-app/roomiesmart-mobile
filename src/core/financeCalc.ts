export interface BackendPayment {
  userId: string;
  amount: number | null;
  paidAt: string;
}

export interface BackendExpense {
  id: string;
  departmentId: string;
  payerId: string;
  amount: number;
  description: string;
  participants?: string[] | null;
  payments?: BackendPayment[];
  expenseDate: string;
  payerDetails?: { id: string; email: string };
}

export interface DebtBreakdownItem {
  expenseId: string;
  title: string;
  amount: number;
  // 'they_owe' = ese roomie me debe esta parte; 'i_owe' = yo le debo esta parte
  kind: 'they_owe' | 'i_owe';
}

export interface RoommateDebt {
  id: string;
  name: string;
  amount: number;
  type: 'owes_you' | 'you_owe';
  breakdown: DebtBreakdownItem[];
}

export interface Transaction {
  id: string;
  title: string;
  paidBy: string;
  sharedWithCount: number;
  totalAmount: number;
  yourShare?: number;
  yourSharePaid?: boolean;
  owedToYou?: number;
  isPaid: boolean;
  paidDebtors: number;
  totalDebtors: number;
  expenseDate: string;
}

export interface FinanceDashboardData {
  summary: {
    houseTotal: number;
    youOwe: number;
    owedToYou: number;
    myShareTotal: number;
  };
  transactions: Transaction[];
  roommateDebts: RoommateDebt[];
}

export interface DashboardMember {
  id: string;
  email?: string;
}

const nameFromEmail = (email?: string) => email?.split('@')[0] || 'Roomie';

export function computeFinanceDashboard(
  rawData: BackendExpense[],
  currentUserId: string,
  members: DashboardMember[],
): FinanceDashboardData {
  const allMemberIds = members.map(m => m.id);

  const participantsOf = (expense: BackendExpense): string[] =>
    expense.participants?.length
      ? expense.participants
      : allMemberIds.length > 0
        ? allMemberIds
        : [expense.payerId];

  const paidSetOf = (expense: BackendExpense): Set<string> =>
    new Set((expense.payments ?? []).map(p => p.userId));

  let houseTotal = 0;
  let youOwe = 0;
  let owedToYou = 0;
  let myShareTotal = 0;
  const shares = rawData.map(expense => {
    const participants = participantsOf(expense);
    const paidSet = paidSetOf(expense);
    const participantCount = Math.max(participants.length, 1);
    const paidByMe = expense.payerId === currentUserId;
    const iParticipate = participants.includes(currentUserId);
    const iHavePaid = paidSet.has(currentUserId);
    const unpaidOthersCount = participants.filter(id => id !== expense.payerId && !paidSet.has(id)).length;

    houseTotal += expense.amount;
    const share = expense.amount / participantCount;

    if (iParticipate) myShareTotal += share;
    if (paidByMe) {
      owedToYou += share * Math.max(unpaidOthersCount, 0);
    } else if (iParticipate && !iHavePaid) {
      youOwe += share;
    }
    return share;
  });

  const netByRoomie = new Map<string, { net: number; items: DebtBreakdownItem[] }>();
  const emailById = new Map<string, string | undefined>(members.map(m => [m.id, m.email]));

  const entryFor = (roomieId: string) => {
    let entry = netByRoomie.get(roomieId);
    if (!entry) {
      entry = { net: 0, items: [] };
      netByRoomie.set(roomieId, entry);
    }
    return entry;
  };

  const transactions: Transaction[] = rawData.map((expense, index) => {
    const participants = participantsOf(expense);
    const paidSet = paidSetOf(expense);
    const share = shares[index];
    const isMe = expense.payerId === currentUserId;
    const iParticipate = participants.includes(currentUserId);
    const iHavePaid = paidSet.has(currentUserId);

    const debtors = participants.filter(id => id !== expense.payerId);
    const paidDebtors = debtors.filter(id => paidSet.has(id)).length;
    const isPaid = paidDebtors === debtors.length;

    if (isMe) {
      for (const participantId of debtors) {
        if (paidSet.has(participantId)) continue;
        const entry = entryFor(participantId);
        entry.net += share;
        entry.items.push({ expenseId: expense.id, title: expense.description, amount: share, kind: 'they_owe' });
      }
    } else if (iParticipate && !iHavePaid) {
      const entry = entryFor(expense.payerId);
      entry.net -= share;
      entry.items.push({ expenseId: expense.id, title: expense.description, amount: share, kind: 'i_owe' });
      if (!emailById.has(expense.payerId)) {
        emailById.set(expense.payerId, expense.payerDetails?.email);
      }
    }

    return {
      id: expense.id,
      title: expense.description,
      paidBy: isMe ? 'Ti' : nameFromEmail(expense.payerDetails?.email),
      sharedWithCount: participants.length,
      totalAmount: expense.amount,
      yourShare: !isMe && iParticipate ? share : undefined,
      yourSharePaid: !isMe && iParticipate ? iHavePaid : undefined,
      owedToYou: isMe ? share * debtors.filter(id => !paidSet.has(id)).length : undefined,
      isPaid,
      paidDebtors,
      totalDebtors: debtors.length,
      expenseDate: expense.expenseDate,
    };
  });

  const roommateDebts: RoommateDebt[] = [...netByRoomie.entries()]
    .filter(([, entry]) => Math.abs(entry.net) > 0.005)
    .map(([roomieId, entry]) => ({
      id: roomieId,
      name: nameFromEmail(emailById.get(roomieId)),
      amount: Math.abs(entry.net),
      type: entry.net > 0 ? ('owes_you' as const) : ('you_owe' as const),
      breakdown: entry.items,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    summary: { houseTotal, youOwe, owedToYou, myShareTotal },
    transactions,
    roommateDebts,
  };
}
