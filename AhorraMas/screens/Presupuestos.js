import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import TransaccionController from '../controllers/transaccionController';
import UsuarioController from '../controllers/usuarioController';

const EXPENSE_CATEGORIES = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros Gastos'];

export default function Presupuesto({ navigation }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [budgets, setBudgets] = useState([]);
  const [resumen, setResumen] = useState({ gastosPorCategoria: {} });
  const [prefs, setPrefs] = useState({ notifications: { budgetAlerts: true } });
  const [notifiedOver, setNotifiedOver] = useState(new Set());
  const [notifiedNear, setNotifiedNear] = useState(new Set());
  
  // Estados para el filtro por categorías
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [showFilter, setShowFilter] = useState(false);

  const currentUser = UsuarioController.getCurrentUser();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentBudgets = budgets.filter((b) => (b.mes || b.month) === currentMonth);
  
  // Aplicar filtro por categorías a los presupuestos actuales
  const filteredBudgets = filterCategory === 'Todas' 
    ? currentBudgets 
    : currentBudgets.filter((b) => (b.categoria || b.category) === filterCategory);

  // Calcular gastos para cada presupuesto 
  const getBudgetProgress = (budget) => {
    const catKey = budget.categoria || budget.category;
    let gasto = 0;
    if (resumen && resumen.gastosPorCategoria) {
      const gp = resumen.gastosPorCategoria;
      if (Array.isArray(gp)) {
        const found = gp.find(item => (item.categoria === catKey || item.category === catKey));
        gasto = found ? (found.monto || found.amount || 0) : 0;
      } else if (typeof gp === 'object') {
        gasto = gp[catKey] || 0;
      }
    }
    const spent = gasto;
    const target = budget.monto || budget.amount || 0;
    const percentage = target > 0 ? (spent / target) * 100 : 0;
    const remaining = target - spent;
    console.log(`[Presupuestos] getBudgetProgress: id=${budget.id} catKey=${catKey} spent=${spent} target=${target} pct=${percentage.toFixed(1)}`);
    return { spent, percentage, remaining };
  };

  // Alertas de presupuesto
  useEffect(() => {
    if (!prefs || !prefs.notifications || !prefs.notifications.budgetAlerts) return;

    currentBudgets.forEach((budget) => {
      const { percentage, remaining } = getBudgetProgress(budget);
      // notificar excedido
      if (percentage > 100 && !notifiedOver.has(budget.id)) {
        Alert.alert('¡Presupuesto excedido!', `Has superado el presupuesto de ${budget.categoria || budget.category} por ${formatCurrency(Math.abs(remaining))}`);
        setNotifiedOver(prev => new Set(prev).add(budget.id));
      } else if (percentage >= 90 && percentage <= 100 && !notifiedNear.has(budget.id)) {
        Alert.alert('¡Atención!', `Estás cerca del límite de tu presupuesto de ${budget.categoria || budget.category}. Te quedan ${formatCurrency(remaining)}`);
        setNotifiedNear(prev => new Set(prev).add(budget.id));
      }
    });
  }, [resumen, budgets, prefs]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const handleSubmit = () => {
    (async () => {
      try {
        if (!currentUser) {
          Alert.alert('Error', 'Usuario no autenticado');
          return;
        }
        if (!category || !amount) {
          Alert.alert('Error', 'Por favor completa todos los campos');
          return;
        }

        // Verificar si ya existe un presupuesto para esta categoría y mes
        const existingBudget = budgets.find((b) => b.category === category && b.month === month && b.id !== editingBudget?.id);
        if (existingBudget) {
          Alert.alert('Error', 'Ya existe un presupuesto para esta categoría en este mes');
          return;
        }

        if (editingBudget) {
          // Actualizar presupuesto en DB
          await TransaccionController.actualizarPresupuesto(editingBudget.id, category, parseFloat(amount), month, currentUser.id);
          Alert.alert('Éxito', 'Presupuesto actualizado');
        } else {
          // Crear nuevo presupuesto
          await TransaccionController.agregarPresupuesto(category, parseFloat(amount), month, currentUser.id);
          Alert.alert('Éxito', 'Presupuesto creado');
        }

        // refrescar datos
        await loadData();
        setDialogOpen(false);
        setEditingBudget(null);
        setCategory('');
        setAmount('');
        setMonth(currentMonth);
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo guardar el presupuesto');
      }
    })();
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setCategory(budget.categoria || budget.category);
    setAmount((budget.monto || budget.amount).toString());
    setMonth(budget.mes || budget.month);
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
            (async () => {
              try {
                if (!currentUser) {
                  Alert.alert('Error', 'Usuario no autenticado');
                  return;
                }
                await TransaccionController.eliminarPresupuesto(id, currentUser.id);
                await loadData();
                Alert.alert('Éxito', 'Presupuesto eliminado');
              } catch (error) {
                Alert.alert('Error', error.message || 'No se pudo eliminar');
              }
            })();
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

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const presupuestos = await TransaccionController.obtenerPresupuestos(currentUser.id, currentMonth);
      console.log('[Presupuestos] obtenerPresupuestos raw:', presupuestos);
      const normalized = presupuestos.map(p => ({
        id: p.id?.toString(),
        categoria: p.categoria || p.category || p.category,
        monto: p.monto || p.amount || 0,
        mes: p.mes || p.month || p.month
      }));
      console.log('[Presupuestos] normalized presupuestos:', normalized);
      setBudgets(normalized);

      const resumenData = await TransaccionController.obtenerResumenMensual(currentUser.id, currentMonth);
      console.log('[Presupuestos] resumenData:', resumenData);
      setResumen(resumenData);

      const preferences = await UsuarioController.obtenerPreferencias(currentUser.id);
      setPrefs(preferences || {});
    } catch (error) {
      console.error('Error cargando presupuestos:', error);
    }
  }, [currentUser, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const refresh = () => loadData();
    TransaccionController.addListener(refresh);
    return () => TransaccionController.removeListener(refresh);
  }, [loadData]);

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
        {/* Header con Botón Agregar y Filtro */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Presupuestos Mensuales</Text>
            <Text style={styles.filterText}>
              Filtro: {filterCategory}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilter(!showFilter)}
            >
              <Text style={styles.filterButtonIcon}>🔍</Text>
              <Text style={styles.filterButtonText}>Filtrar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={openNewBudgetDialog}
            >
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Nuevo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtro de Categorías */}
        {showFilter && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filtrar por categoría:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterCategory === 'Todas' && styles.filterChipActive
                ]}
                onPress={() => setFilterCategory('Todas')}
              >
                <Text style={[
                  styles.filterChipText,
                  filterCategory === 'Todas' && styles.filterChipTextActive
                ]}>
                  Todas
                </Text>
              </TouchableOpacity>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    filterCategory === cat && styles.filterChipActive
                  ]}
                  onPress={() => setFilterCategory(cat)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterCategory === cat && styles.filterChipTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista de Presupuestos */}
        {filteredBudgets.length > 0 ? (
          <View style={styles.budgetsGrid}>
            {filteredBudgets.map((budget) => {
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
                        <Text style={styles.budgetTitle}>{budget.categoria || budget.category}</Text>
                        {isOverBudget && (
                          <Text style={styles.warningIcon}>⚠️</Text>
                        )}
                      </View>
                      <Text style={styles.budgetAmount}>
                        Presupuesto: {formatCurrency(budget.monto || budget.amount)}
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
            <Text style={styles.emptyTitle}>
              {filterCategory === 'Todas' 
                ? 'No hay presupuestos configurados' 
                : `No hay presupuestos para ${filterCategory}`}
            </Text>
            <Text style={styles.emptyDescription}>
              {filterCategory === 'Todas'
                ? 'Crea tu primer presupuesto para empezar a controlar tus gastos'
                : `No hay presupuestos en la categoría ${filterCategory} para este mes`}
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
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  // Estilos para el filtro
  filterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
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
});
