import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { fetchApi } from '../../core/api';
import { getSession, UserSession } from '../../core/session';

interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  created_at: string;
}

export const FinanceScreen = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (user) {
        setSession(user);
        try {
          // Fetch the latest status to see if they just created or joined a space
          const response = await fetchApi(`/api/v1/identity/check-status/${user.email}`);
          if (response.exists && response.user?.departmentId) {
            setDepartmentId(response.user.departmentId);
            loadExpenses(response.user.departmentId);
          } else {
            setLoading(false);
          }
        } catch (e) {
          // Fallback to session if network fails
          if (user.departmentId) {
            setDepartmentId(user.departmentId);
            loadExpenses(user.departmentId);
          } else {
            setLoading(false);
          }
        }
      }
    };
    init();
  }, []);

  const loadExpenses = async (deptId: string) => {
    try {
      const response = await fetchApi(`/api/expenses/${deptId}`);
      // Asumiendo que response es un array o tiene una propiedad data
      setExpenses(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error loading expenses', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseTitle || !expenseAmount || !departmentId || !session) return;
    
    setSubmitting(true);
    try {
      await fetchApi('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: expenseTitle,
          amount: parseFloat(expenseAmount),
          paidBy: session.id,
          departmentId,
        })
      });
      
      Alert.alert('Éxito', 'Gasto añadido');
      setModalVisible(false);
      setExpenseTitle('');
      setExpenseAmount('');
      loadExpenses(departmentId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const totalGastos = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const miAporte = expenses.filter(e => e.paid_by === session?.id).reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8C3A27" />
      </View>
    );
  }

  if (!departmentId) {
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
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gasto Total (Casa)</Text>
            <Text style={styles.summaryValue}>${totalGastos.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Lo que has pagado</Text>
            <Text style={styles.summaryValue}>${miAporte.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Gastos</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <Text style={styles.noData}>No hay gastos registrados este mes.</Text>
        ) : (
          expenses.map(expense => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseIcon}>
                <Text style={styles.expenseIconText}>🛒</Text>
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseDate}>
                  {new Date(expense.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>${Number(expense.amount).toFixed(2)}</Text>
            </View>
          ))
        )}
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
  summaryCard: {
    backgroundColor: '#3B241C',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#3B241C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#F2E3DB',
    fontSize: 12,
    marginBottom: 5,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
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
