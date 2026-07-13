import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { FinanceRepository } from '../../infrastructure/FinanceRepository';
import { SpaceRepository, PublishedSpace, DepartmentMembersInfo } from '../../infrastructure/SpaceRepository';
import { AuthRepository } from '../../infrastructure/AuthRepository';
import { getSession, UserSession } from '../../core/session';
import { computeFinanceDashboard, FinanceDashboardData, RoommateDebt } from '../../core/financeCalc';

const memberName = (email?: string) => email?.split('@')[0] || 'Roomie';

export const FinanceScreen = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  const [departments, setDepartments] = useState<PublishedSpace[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [membersInfo, setMembersInfo] = useState<DepartmentMembersInfo | null>(null);

  const [dashboard, setDashboard] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [activeDebt, setActiveDebt] = useState<RoommateDebt | null>(null);
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (!user) {
        setLoading(false);
        return;
      }
      setSession(user);
      try {
        const profile = await AuthRepository.getMe();
        setMonthlyBudget(profile.monthlyBudget ?? 0);

        const myDepartments = await SpaceRepository.getUserDepartments(user.id);
        setDepartments(myDepartments);

        const initialId = myDepartments.some(d => d.id === user.departmentId)
          ? user.departmentId
          : myDepartments[0]?.id ?? null;
        setSelectedDepartmentId(initialId ?? null);
        if (!initialId) setLoading(false);
      } catch (e) {
        console.error('Error cargando perfil/departamentos', e);
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadDashboard = useCallback(async (departmentId: string, currentUser: UserSession) => {
    setLoading(true);
    try {
      const info = await SpaceRepository.getDepartmentMembers(departmentId);
      setMembersInfo(info);

      if (!info.sharedFinancesEnabled) {
        setDashboard(null);
        return;
      }

      const response = await FinanceRepository.getExpenses(departmentId);
      const rawExpenses = Array.isArray(response) ? response : response.data || [];
      const members = info.members.map(m => ({ id: m.user_id, email: m.users?.email }));
      setDashboard(computeFinanceDashboard(rawExpenses, currentUser.id, members));
    } catch (error) {
      console.error('Error cargando finanzas', error);
      Alert.alert('Error', 'No pudimos cargar tus gastos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDepartmentId && session) {
      loadDashboard(selectedDepartmentId, session);
    }
  }, [selectedDepartmentId, session, loadDashboard]);

  const openAddExpense = () => {
    setExpenseTitle('');
    setExpenseAmount('');
    setParticipantIds(membersInfo?.members.map(m => m.user_id) ?? []);
    setModalVisible(true);
  };

  const toggleParticipant = (userId: string) => {
    setParticipantIds(current =>
      current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]
    );
  };

  const handleAddExpense = async () => {
    if (!expenseTitle || !expenseAmount || !selectedDepartmentId || !session) return;
    if (participantIds.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una persona involucrada en el gasto.');
      return;
    }

    setSubmitting(true);
    try {
      await FinanceRepository.addExpense({
        description: expenseTitle,
        amount: parseFloat(expenseAmount),
        payerId: session.id,
        departmentId: selectedDepartmentId,
        participants: participantIds,
      });

      Alert.alert('Éxito', 'Gasto añadido');
      setModalVisible(false);
      loadDashboard(selectedDepartmentId, session);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayItem = async (expenseId: string) => {
    if (!session || !selectedDepartmentId) return;
    setPayingExpenseId(expenseId);
    try {
      await FinanceRepository.payShare(expenseId, session.id);
      Alert.alert('Éxito', 'Pago registrado, tu deuda se actualizó.');
      setActiveDebt(null);
      loadDashboard(selectedDepartmentId, session);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el pago.');
    } finally {
      setPayingExpenseId(null);
    }
  };

  const handleRemind = async (debt: RoommateDebt) => {
    if (!session) return;
    setRemindingId(debt.id);
    try {
      await FinanceRepository.sendReminder({
        debtorId: debt.id,
        creditorName: memberName(session.email),
        amount: debt.amount,
        items: debt.breakdown.filter(i => i.kind === 'they_owe').map(i => `${i.title}: $${i.amount.toFixed(2)}`),
      });
      Alert.alert('Listo', `Recordatorio enviado a ${debt.name}.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el recordatorio.');
    } finally {
      setRemindingId(null);
    }
  };

  const youOwe = dashboard?.summary.youOwe ?? 0;
  const owedToYou = dashboard?.summary.owedToYou ?? 0;
  const myShareTotal = dashboard?.summary.myShareTotal ?? 0;
  const available = monthlyBudget - myShareTotal;

  const watchedAmount = Number(expenseAmount) || 0;
  const previewShare = watchedAmount > 0 && participantIds.length > 0 ? watchedAmount / participantIds.length : 0;

  if (loading && !dashboard && !membersInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8C3A27" />
      </View>
    );
  }

  if (!selectedDepartmentId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Finanzas Compartidas</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No estás en ningún espacio</Text>
          <Text style={styles.emptyText}>Debes unirte a un departamento o crear uno para usar las finanzas compartidas.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Finanzas Compartidas</Text>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {departments.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptSelector} contentContainerStyle={{ gap: 8 }}>
            {departments.map(dept => (
              <TouchableOpacity
                key={dept.id}
                style={[styles.deptChip, dept.id === selectedDepartmentId && styles.deptChipActive]}
                onPress={() => setSelectedDepartmentId(dept.id)}
              >
                <Text style={[styles.deptChipText, dept.id === selectedDepartmentId && styles.deptChipTextActive]}>
                  {dept.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Presupuesto</Text>
            <Text style={styles.statValue}>{monthlyBudget > 0 ? `$${monthlyBudget.toFixed(2)}` : '---'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Debes</Text>
            <Text style={[styles.statValue, styles.statDanger]}>{dashboard ? `$${youOwe.toFixed(2)}` : '---'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Te deben</Text>
            <Text style={[styles.statValue, styles.statSuccess]}>{dashboard ? `$${owedToYou.toFixed(2)}` : '---'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Disponible Real</Text>
            <Text style={styles.statValue}>{dashboard && monthlyBudget > 0 ? `$${available.toFixed(2)}` : '---'}</Text>
          </View>
        </View>

        {membersInfo && !membersInfo.sharedFinancesEnabled && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnTitle}>Las finanzas compartidas aún no aplican</Text>
            <Text style={styles.warnText}>
              Tu departamento tiene {membersInfo.count} miembro. La división de gastos se activa automáticamente
              cuando aceptes al menos un roomie (2+ miembros).
            </Text>
          </View>
        )}

        {membersInfo && membersInfo.members.length > 0 && (
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Miembros del departamento</Text>
            <View style={styles.membersRow}>
              {membersInfo.members.map(member => (
                <View key={member.user_id} style={styles.memberChip}>
                  <Text style={styles.memberChipText}>
                    {memberName(member.users?.email)}{member.user_id === session?.id ? ' (tú)' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {dashboard && dashboard.roommateDebts.length > 0 && (
          <View style={styles.debtsSection}>
            {dashboard.roommateDebts.map(debt => (
              <TouchableOpacity key={debt.id} style={styles.debtCard} onPress={() => setActiveDebt(debt)}>
                <Text style={styles.debtName}>{debt.name}</Text>
                <Text style={[styles.debtAmount, debt.type === 'owes_you' ? styles.statSuccess : styles.statDanger]}>
                  {debt.type === 'owes_you' ? 'Te debe' : 'Le debes'} ${debt.amount.toFixed(2)}
                </Text>
                <Text style={styles.debtDetailLink}>Ver detalle →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Gastos</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openAddExpense}
            disabled={!membersInfo || !membersInfo.sharedFinancesEnabled}
          >
            <Text style={styles.addBtnText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>

        {dashboard && dashboard.transactions.length === 0 && (
          <Text style={styles.noData}>No hay gastos registrados este mes.</Text>
        )}
        {dashboard?.transactions.map(transaction => (
          <View key={transaction.id} style={styles.expenseCard}>
            <View style={styles.expenseIcon}>
              <Text style={styles.expenseIconText}>🛒</Text>
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle}>{transaction.title}</Text>
              <Text style={styles.expenseDate}>
                Pagado por {transaction.paidBy} · {new Date(transaction.expenseDate).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>${transaction.totalAmount.toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Modal para añadir gasto */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Nuevo Gasto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Concepto (ej: Luz, Internet)</Text>
              <TextInput
                style={styles.input}
                value={expenseTitle}
                onChangeText={setExpenseTitle}
                placeholder="Título del gasto"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Monto Total ($)</Text>
              <TextInput
                style={styles.input}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>¿Quiénes están involucrados?</Text>
              <ScrollView style={styles.participantsList}>
                {membersInfo?.members.map(member => {
                  const checked = participantIds.includes(member.user_id);
                  return (
                    <TouchableOpacity
                      key={member.user_id}
                      style={styles.participantRow}
                      onPress={() => toggleParticipant(member.user_id)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={styles.checkboxMark}>✓</Text>}
                      </View>
                      <Text style={styles.participantText}>
                        {memberName(member.users?.email)}{member.user_id === session?.id ? ' (tú)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {previewShare > 0 && (
                <Text style={styles.sharePreview}>
                  ${watchedAmount.toFixed(2)} ÷ {participantIds.length} {participantIds.length === 1 ? 'persona' : 'personas'} = ${previewShare.toFixed(2)} c/u
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleAddExpense}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Registrar Gasto</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de detalle de deuda */}
      <Modal visible={!!activeDebt} animationType="slide" transparent onRequestClose={() => setActiveDebt(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeDebt?.name}</Text>
              <TouchableOpacity onPress={() => setActiveDebt(null)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {activeDebt?.breakdown.map(item => (
                <View key={item.expenseId} style={styles.breakdownRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownTitle}>{item.title}</Text>
                    <Text style={styles.breakdownKind}>
                      {item.kind === 'i_owe' ? 'Tú debes' : 'Te debe'} ${item.amount.toFixed(2)}
                    </Text>
                  </View>
                  {item.kind === 'i_owe' && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() => handlePayItem(item.expenseId)}
                      disabled={payingExpenseId === item.expenseId}
                    >
                      {payingExpenseId === item.expenseId ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.payBtnText}>Marcar pagado</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            {activeDebt?.type === 'owes_you' && (
              <TouchableOpacity
                style={[styles.submitBtn, remindingId === activeDebt.id && styles.submitBtnDisabled]}
                onPress={() => activeDebt && handleRemind(activeDebt)}
                disabled={remindingId === activeDebt?.id}
              >
                {remindingId === activeDebt?.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Enviar recordatorio</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A3513D',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3B241C',
  },
  content: {
    padding: 20,
  },
  deptSelector: {
    marginBottom: 15,
  },
  deptChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  deptChipActive: {
    backgroundColor: '#8C3A27',
    borderColor: '#8C3A27',
  },
  deptChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3B241C',
  },
  deptChipTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B241C',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#827471',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flexBasis: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  statLabel: {
    fontSize: 11,
    color: '#827471',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3B241C',
  },
  statDanger: {
    color: '#C0392B',
  },
  statSuccess: {
    color: '#2E7D32',
  },
  warnBanner: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F0D9A8',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  warnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3B241C',
    marginBottom: 6,
  },
  warnText: {
    fontSize: 13,
    color: '#666',
  },
  membersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1DED6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B241C',
  },
  debtsSection: {
    gap: 10,
    marginBottom: 20,
  },
  debtCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  debtName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  debtDetailLink: {
    fontSize: 12,
    color: '#8C3A27',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1DED6',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  expenseDate: {
    fontSize: 12,
    color: '#827471',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#8C3A27',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B241C',
  },
  closeModal: {
    fontSize: 20,
    color: '#999',
    padding: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B241C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FDF8F6',
    borderWidth: 1,
    borderColor: '#E5D1C6',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  participantsList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E5D1C6',
    borderRadius: 15,
    padding: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8C3A27',
    borderColor: '#8C3A27',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  participantText: {
    fontSize: 14,
    color: '#3B241C',
    fontWeight: '600',
  },
  sharePreview: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8C3A27',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1DED6',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  breakdownKind: {
    fontSize: 12,
    color: '#827471',
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#8C3A27',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
