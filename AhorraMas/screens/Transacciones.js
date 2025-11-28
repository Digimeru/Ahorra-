import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import TransaccionController from '../controllers/transaccionController';
import UsuarioController from '../controllers/usuarioController';

const INCOME_CATEGORIES = ['Salario', 'Freelance', 'Inversiones', 'Otros Ingresos'];
const EXPENSE_CATEGORIES = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros Gastos'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export default function Transacciones({ navigation }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [transactions, setTransactions] = useState([]);
  const currentUser = UsuarioController.getCurrentUser();
  // Carga los datos de la BD y los traduce para la vista
  const cargarDatos = async () => {
    if (currentUser) {
      try {
        const datos = await TransaccionController.obtenerTransacciones(currentUser.id);
        
        // Traduce campo por campo
        const datosTraducidos = datos.map(t => ({
          id: t.id.toString(),
          type: t.tipo,                
          amount: t.monto,              
          category: t.categoria,        
          description: t.descripcion,   
          
          date: t.fecha.split('-').reverse().join('/') 
        }));

        setTransactions(datosTraducidos);
      } catch (error) {
        console.error("Error cargando transacciones:", error);
      }
    }
  };
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [currentUser])
  );

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return dateString;
  };

  const validateDate = (dateString) => {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) {
      return false;
    }
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month < 1 || month > 12) {
      return false;
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    
    if (day < 1 || day > daysInMonth) {
      return false;
    }
    
    if (year < 1900 || year > 2100) {
      return false;
    }
    
    return true;
  };

  const formatDateInput = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }
    
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    } else {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
    }
  };

  const calculateTotals = () => {
    const totalIngresos = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalGastos = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIngresos - totalGastos;
    
    return { totalIngresos, totalGastos, balance };
  };

  const { totalIngresos, totalGastos, balance } = calculateTotals();

  const handleSubmit = async () => {

    if (!currentUser) {
      Alert.alert("Error", "Se perdió la sesión. Sal y vuelve a entrar.");
      return;
    }

    if (!amount || !category || !date) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const amountNumber = parseFloat(amount);
    
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (type === 'income' && amountNumber < 0) {
      Alert.alert('Error', 'Los ingresos no pueden ser negativos');
      return;
    }

    if (!validateDate(date)) {
      Alert.alert('Error', 'Por favor ingresa una fecha válida en formato DD/MM/AAAA\n\nEjemplo: 15/01/2024');
      return;
    }
    try {

      const [day, month, year] = date.split('/');
      const isoDate = `${year}-${month}-${day}`;

      const tipoEnEspanol = type === 'income' ? 'ingreso' : 'gasto';

      await TransaccionController.agregarTransaccion(
        tipoEnEspanol,
        amountNumber, 
        category,
        description,
        isoDate, 
        currentUser.id
      );
      
      Alert.alert(
        '✅ Éxito', 
        `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente`,
        [{ text: 'Aceptar' }]
      );

      // Recarga la lista
      cargarDatos(); 
      
      // Limpia los campos
      setAmount('');
      setCategory('');
      setDescription('');
      setDate('');
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditCategory(transaction.category);
    setEditDate(transaction.date);
    setEditDescription(transaction.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;

    const amountNumber = parseFloat(editAmount);
    
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (editingTransaction.type === 'income' && amountNumber < 0) {
      Alert.alert('Error', 'Los ingresos no pueden ser negativos');
      return;
    }

    if (!validateDate(editDate)) {
      Alert.alert('Error', 'Por favor ingresa una fecha válida en formato DD/MM/AAAA\n\nEjemplo: 15/01/2024');
      return;
    }

    setTransactions(transactions.map(t => 
      t.id === editingTransaction.id 
        ? { 
            ...t, 
            amount: amountNumber,
            category: editCategory,
            date: editDate,
            description: editDescription
          }
        : t
    ));

    Alert.alert('✅ Éxito', 'Transacción actualizada correctamente');
    setEditModalVisible(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id) => {
    Alert.alert(
      '🗑️ Eliminar Transacción',
      '¿Estás seguro de que deseas eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {

              await TransaccionController.eliminarTransaccion(id, currentUser.id);

              await cargarDatos(); 
              
              Alert.alert('✅ Éxito', 'Transacción eliminada correctamente');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handleEditAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setEditAmount(cleaned);
  };

  const handleDateChange = (text) => {
    const formatted = formatDateInput(text);
    setDate(formatted);
  };

  const handleEditDateChange = (text) => {
    const formatted = formatDateInput(text);
    setEditDate(formatted);
  };

  let filteredTransactions = [...transactions].sort((a, b) => {
    const dateA = a.date.split('/').reverse().join('-');
    const dateB = b.date.split('/').reverse().join('-');
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (filterCategory !== 'all') {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.category === filterCategory
    );
  }

  if (filterDateFrom) {
    filteredTransactions = filteredTransactions.filter(
      (t) => {
        const transactionDate = t.date.split('/').reverse().join('-');
        const filterFrom = filterDateFrom.split('/').reverse().join('-');
        return new Date(transactionDate) >= new Date(filterFrom);
      }
    );
  }

  if (filterDateTo) {
    filteredTransactions = filteredTransactions.filter(
      (t) => {
        const transactionDate = t.date.split('/').reverse().join('-');
        const filterTo = filterDateTo.split('/').reverse().join('-');
        return new Date(transactionDate) <= new Date(filterTo);
      }
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transacciones</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus ingresos y gastos</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen Financiero</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={styles.incomeSummary}>+{formatCurrency(totalIngresos)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={styles.expenseSummary}>-{formatCurrency(totalGastos)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[
                styles.balanceSummary,
                { color: balance >= 0 ? '#16a34a' : '#dc2626' }
              ]}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nueva Transacción</Text>
            <Text style={styles.requiredText}>* Campos obligatorios</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Tipo de Transacción *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'expense' && styles.typeButtonActive
                    ]}
                    onPress={() => {
                      setType('expense');
                      setCategory('');
                    }}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === 'expense' && styles.typeButtonTextActive
                    ]}>
                      💸 Gasto
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'income' && styles.typeButtonActive
                    ]}
                    onPress={() => {
                      setType('income');
                      setCategory('');
                    }}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === 'income' && styles.typeButtonTextActive
                    ]}>
                      💰 Ingreso
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Monto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Categoría *</Text>
                <ScrollView style={styles.categoriesContainer} horizontal>
                  <View style={styles.categoriesRow}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          category === cat && styles.categoryChipSelected
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Fecha *</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={handleDateChange}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9ca3af"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Agregar una descripción (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonIcon}>💾 Agregar Transacción</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filtros</Text>
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterToggleIcon}>🔍</Text>
              <Text style={styles.filterToggleText}>
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Text>
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <View style={styles.filterField}>
                  <Text style={styles.label}>Categoría</Text>
                  <ScrollView style={styles.filterCategories} horizontal>
                    <View style={styles.categoriesRow}>
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          filterCategory === 'all' && styles.filterChipSelected
                        ]}
                        onPress={() => setFilterCategory('all')}
                      >
                        <Text style={[
                          styles.filterChipText,
                          filterCategory === 'all' && styles.filterChipTextSelected
                        ]}>
                          Todas
                        </Text>
                      </TouchableOpacity>
                      {ALL_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.filterChip,
                            filterCategory === cat && styles.filterChipSelected
                          ]}
                          onPress={() => setFilterCategory(cat)}
                        >
                          <Text style={[
                            styles.filterChipText,
                            filterCategory === cat && styles.filterChipTextSelected
                          ]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterField}>
                  <Text style={styles.label}>Fecha desde</Text>
                  <TextInput
                    style={styles.input}
                    value={filterDateFrom}
                    onChangeText={setFilterDateFrom}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.filterField}>
                  <Text style={styles.label}>Fecha hasta</Text>
                  <TextInput
                    style={styles.input}
                    value={filterDateTo}
                    onChangeText={setFilterDateTo}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📋 Transacciones ({filteredTransactions.length})
            </Text>
          </View>

          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                  ]}>
                    <Text style={styles.transactionIconText}>
                      {transaction.type === 'income' ? '📈' : '📉'}
                    </Text>
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || 'Sin descripción'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>

                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText,
                      transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>

                  <View style={styles.transactionActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEdit(transaction)}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDelete(transaction.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyTitle}>No hay transacciones</Text>
              <Text style={styles.emptyDescription}>
                {filterCategory !== 'all' || filterDateFrom || filterDateTo 
                  ? 'No hay transacciones que coincidan con los filtros'
                  : 'Agrega tu primera transacción'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <ScrollView>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Transacción</Text>

            {editingTransaction && (
              <View style={styles.form}>
                <View style={styles.formField}>
                  <Text style={styles.label}>Monto *</Text>
                  <TextInput
                    style={styles.input}
                    value={editAmount}
                    onChangeText={handleEditAmountChange}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Categoría *</Text>
                  <ScrollView style={styles.categoriesContainer} horizontal>
                    <View style={styles.categoriesRow}>
                      {(editingTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
                        .map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.categoryChip,
                              editCategory === cat && styles.categoryChipSelected
                            ]}
                            onPress={() => setEditCategory(cat)}
                          >
                            <Text style={[
                              styles.categoryChipText,
                              editCategory === cat && styles.categoryChipTextSelected
                            ]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Fecha *</Text>
                  <TextInput
                    style={styles.input}
                    value={editDate}
                    onChangeText={handleEditDateChange}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9ca3af"
                    maxLength={10}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.submitButtonText}>💾 Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
        </ScrollView>
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  incomeSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  expenseSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  balanceSummary: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  requiredText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  form: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formField: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  categoryChipSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  submitButtonIcon: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  filterToggleIcon: {
    fontSize: 14,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filtersContainer: {
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  filterField: {
    flex: 1,
    gap: 8,
  },
  filterCategories: {
    maxHeight: 40,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  filterChipSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#ffffff',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#dcfce7',
  },
  expenseIcon: {
    backgroundColor: '#fee2e2',
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    marginRight: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#16a34a',
  },
  expenseAmount: {
    color: '#dc2626',
  },
  transactionActions: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
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
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});
