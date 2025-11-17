import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,TextInput,Modal,Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Datos de ejemplo (en una app real vendrían de un contexto o estado global)
const EXPENSE_CATEGORIES = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros Gastos'];

export default function Presupuesto({ navigation }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM formato
  );

  // Datos de ejemplo (Se tienen que reemplazar con contexto)
  const [budgets, setBudgets] = useState([
    {
      id: '1',
      category: 'Alimentación',
      amount: 400000,
      month: new Date().toISOString().slice(0, 7)
    },
    {
      id: '2', 
      category: 'Transporte',
      amount: 150000,
      month: new Date().toISOString().slice(0, 7)
    }
  ]);

  const [transactions] = useState([
    { id: '1', type: 'expense', category: 'Alimentación', amount: 350000, date: new Date().toISOString() },
    { id: '2', type: 'expense', category: 'Transporte', amount: 120000, date: new Date().toISOString() },
    { id: '3', type: 'expense', category: 'Ocio', amount: 80000, date: new Date().toISOString() }
  ]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBudgets = budgets.filter((b) => b.month === currentMonth);

  // Calcular gastos para cada presupuesto
  const getBudgetProgress = (budget) => {
    const budgetMonth = budget.month;
    const [year, monthNum] = budgetMonth.split('-').map(Number);

    const spent = transactions
      .filter((t) => {
        if (t.type !== 'expense' || t.category !== budget.category) return false;
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === monthNum - 1
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;

    return { spent, percentage, remaining };
  };

  // Alertas de presupuesto
  useEffect(() => {
    currentBudgets.forEach((budget) => {
      const { percentage, remaining } = getBudgetProgress(budget);
      
      if (percentage > 100) {
        Alert.alert(
          '¡Presupuesto excedido!',
          `Has superado el presupuesto de ${budget.category} por ${formatCurrency(Math.abs(remaining))}`
        );
      } else if (percentage >= 90 && percentage <= 100) {
        Alert.alert(
          '¡Atención!',
          `Estás cerca del límite de tu presupuesto de ${budget.category}. Te quedan ${formatCurrency(remaining)}`
        );
      }
    });
  }, [transactions, currentBudgets.length]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const handleSubmit = () => {
    if (!category || !amount) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Verificar si ya existe un presupuesto para esta categoría y mes
    const existingBudget = budgets.find(
      (b) => b.category === category && b.month === month && b.id !== editingBudget?.id
    );

    if (existingBudget) {
      Alert.alert('Error', 'Ya existe un presupuesto para esta categoría en este mes');
      return;
    }

    if (editingBudget) {
      // Actualizar presupuesto existente
      setBudgets(budgets.map(b => 
        b.id === editingBudget.id 
          ? { ...b, category, amount: parseFloat(amount), month }
          : b
      ));
      Alert.alert('Éxito', 'Presupuesto actualizado');
    } else {
      // Crear nuevo presupuesto
      const newBudget = {
        id: Date.now().toString(),
        category,
        amount: parseFloat(amount),
        month,
      };
      setBudgets([...budgets, newBudget]);
      Alert.alert('Éxito', 'Presupuesto creado');
    }

    setDialogOpen(false);
    setEditingBudget(null);
    setCategory('');
    setAmount('');
    setMonth(currentMonth);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setAmount(budget.amount.toString());
    setMonth(budget.month);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Presupuesto',
      '¿Estás seguro de que deseas eliminar este presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setBudgets(budgets.filter(b => b.id !== id));
            Alert.alert('Éxito', 'Presupuesto eliminado');
          }
        }
      ]
    );
  };

  const openNewBudgetDialog = () => {
    setEditingBudget(null);
    setCategory('');
    setAmount('');
    setMonth(currentMonth);
    setDialogOpen(true);
  };

  // Componente Progress Bar
  const ProgressBar = ({ percentage, color }) => {
    const progressColor = percentage > 100 ? '#dc2626' : percentage >= 90 ? '#eab308' : color;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: progressColor
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - Ahora pegado arriba */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Presupuestos</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {/* Header con Botón Agregar */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Presupuestos Mensuales</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={openNewBudgetDialog}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Nuevo Presupuesto</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Presupuestos */}
        {currentBudgets.length > 0 ? (
          <View style={styles.budgetsGrid}>
            {currentBudgets.map((budget) => {
              const { spent, percentage, remaining } = getBudgetProgress(budget);
              const isOverBudget = percentage > 100;
              const isNearLimit = percentage >= 90 && percentage <= 100;

              return (
                <View 
                  key={budget.id} 
                  style={[
                    styles.budgetCard,
                    isOverBudget && styles.overBudgetCard
                  ]}
                >
                  <View style={styles.budgetHeader}>
                    <View>
                      <View style={styles.budgetTitleContainer}>
                        <Text style={styles.budgetTitle}>{budget.category}</Text>
                        {isOverBudget && (
                          <Text style={styles.warningIcon}>⚠️</Text>
                        )}
                      </View>
                      <Text style={styles.budgetAmount}>
                        Presupuesto: {formatCurrency(budget.amount)}
                      </Text>
                    </View>
                    <View style={styles.budgetActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEdit(budget)}
                      >
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDelete(budget.id)}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.budgetContent}>
                    {/* Barra de Progreso */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>Gastado</Text>
                        <Text style={[
                          styles.progressAmount,
                          isOverBudget && styles.overBudgetText
                        ]}>
                          {formatCurrency(spent)}
                        </Text>
                      </View>
                      
                      <ProgressBar 
                        percentage={percentage} 
                        color="#16a34a"
                      />
                      
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressPercentage}>
                          {percentage.toFixed(1)}% utilizado
                        </Text>
                        <Text style={[
                          styles.remainingAmount,
                          remaining >= 0 ? styles.positiveAmount : styles.negativeAmount
                        ]}>
                          {remaining >= 0 ? 'Quedan ' : 'Excedido '}
                          {formatCurrency(Math.abs(remaining))}
                        </Text>
                      </View>
                    </View>

                    {/* Mensaje de Alerta */}
                    {isOverBudget && (
                      <View style={styles.alertContainer}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.alertText}>
                          Has excedido tu presupuesto por {formatCurrency(Math.abs(remaining))}
                        </Text>
                      </View>
                    )}
                    {isNearLimit && !isOverBudget && (
                      <View style={styles.warningContainer}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningText}>
                          Estás cerca del límite de tu presupuesto
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No hay presupuestos configurados</Text>
            <Text style={styles.emptyDescription}>
              Crea tu primer presupuesto para empezar a controlar tus gastos
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para Formulario de Presupuesto */}
      <Modal
        visible={dialogOpen}
        animationType='fade'
        transparent={true}
        onRequestClose={() => setDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </Text>

            <View style={styles.form}>
              {/* Selector de Categoría */}
              <View style={styles.formField}>
                <Text style={styles.label}>Categoría</Text>
                <ScrollView style={styles.categoriesContainer}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        category === cat && styles.categoryOptionSelected
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextSelected
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Monto del Presupuesto */}
              <View style={styles.formField}>
                <Text style={styles.label}>Monto del Presupuesto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Selector de Mes */}
              <View style={styles.formField}>
                <Text style={styles.label}>Mes</Text>
                <TextInput
                  style={styles.input}
                  value={month}
                  onChangeText={setMonth}
                  placeholder="YYYY-MM"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Botones */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setDialogOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navegación Inferior */}
      <SafeAreaView style={styles.navSafeArea}>
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Transacciones')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={styles.navText}>Transacciones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Presupuestos')}
          >
            <Text style={[styles.navIcon, styles.navIconActive]}>📊</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Presupuestos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerSafeArea: {
    backgroundColor: '#16a34a',
  },
  header: {
    backgroundColor: '#16a34a',
    paddingVertical: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 1,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.9,
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 9,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  budgetsGrid: {
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overBudgetCard: {
    borderColor: '#fecaca',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 16,
  },
  deleteIcon: {
    fontSize: 16,
    color: '#dc2626',
  },
  budgetContent: {
    gap: 12,
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  overBudgetText: {
    color: '#dc2626',
  },
  progressContainer: {
    marginVertical: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#16a34a',
  },
  negativeAmount: {
    color: '#dc2626',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderColor: '#fed7aa',
    borderWidth: 1,
  },
  warningIcon: {
    fontSize: 16,
  },
  alertText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
  warningText: {
    color: '#d97706',
    fontSize: 14,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoriesContainer: {
    maxHeight: 120,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center', 
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#16a34a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Navegación Inferior
  navSafeArea: {
    backgroundColor: '#ffffff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#94a3b8',
  },
  navIconActive: {
    color: '#16a34a',
  },
  navText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  navTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
});