import { useState } from 'react';
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

const INCOME_CATEGORIES = ['Salario', 'Freelance', 'Inversiones', 'Otros Ingresos'];
const EXPENSE_CATEGORIES = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros Gastos'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export default function Transacciones({ navigation }) {
  // Estados para el formulario
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Estados para filtros y lista
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para edición
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Datos de ejemplo
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      type: 'income',
      amount: 2000000,
      category: 'Salario',
      date: '2024-01-15',
      description: 'Pago mensual'
    },
    {
      id: '2',
      type: 'expense',
      amount: 150000,
      category: 'Alimentación',
      date: '2024-01-16',
      description: 'Supermercado'
    },
    {
      id: '3',
      type: 'expense',
      amount: 45000,
      category: 'Transporte',
      date: '2024-01-17',
      description: 'Combustible'
    }
  ]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Agregar transacción
  const handleSubmit = () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      date,
      description,
    };

    setTransactions([newTransaction, ...transactions]);
    Alert.alert('Éxito', `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado exitosamente`);

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Editar transacción
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

    setTransactions(transactions.map(t => 
      t.id === editingTransaction.id 
        ? { 
            ...t, 
            amount: parseFloat(editAmount),
            category: editCategory,
            date: editDate,
            description: editDescription
          }
        : t
    ));

    Alert.alert('Éxito', 'Transacción actualizada');
    setEditModalVisible(false);
    setEditingTransaction(null);
  };

  // Eliminar transacción
  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Transacción',
      '¿Estás seguro de que deseas eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setTransactions(transactions.filter(t => t.id !== id));
            Alert.alert('Éxito', 'Transacción eliminada');
          }
        }
      ]
    );
  };

  // Filtrar transacciones
  let filteredTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (filterCategory !== 'all') {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.category === filterCategory
    );
  }

  if (filterDateFrom) {
    filteredTransactions = filteredTransactions.filter(
      (t) => new Date(t.date) >= new Date(filterDateFrom)
    );
  }

  if (filterDateTo) {
    filteredTransactions = filteredTransactions.filter(
      (t) => new Date(t.date) <= new Date(filterDateTo)
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transacciones</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus ingresos y gastos</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {/* Formulario de Nueva Transacción */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nueva Transacción</Text>
            <Text style={styles.requiredText}>* Campos obligatorios</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formRow}>
              {/* Tipo de Transacción */}
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
                      Gasto
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
                      Ingreso
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Monto */}
              <View style={styles.formField}>
                <Text style={styles.label}>Monto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              {/* Categoría */}
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

              {/* Fecha */}
              <View style={styles.formField}>
                <Text style={styles.label}>Fecha *</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Descripción */}
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

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonIcon}>+Agregar</Text>
              <Text style={styles.submitButtonText}></Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros */}
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
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.filterField}>
                  <Text style={styles.label}>Fecha hasta</Text>
                  <TextInput
                    style={styles.input}
                    value={filterDateTo}
                    onChangeText={setFilterDateTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Lista de Transacciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Transacciones ({filteredTransactions.length})
            </Text>
          </View>

          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  {/* Icono */}
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                  ]}>
                    <Text style={styles.transactionIconText}>
                      {transaction.type === 'income' ? '📈' : '📉'}
                    </Text>
                  </View>

                  {/* Información */}
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

                  {/* Monto */}
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText,
                      transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>

                  {/* Acciones */}
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

      {/* Modal de Edición */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Transacción</Text>

            {editingTransaction && (
              <View style={styles.form}>
                <View style={styles.formField}>
                  <Text style={styles.label}>Monto *</Text>
                  <TextInput
                    style={styles.input}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
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
                    onChangeText={setEditDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
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
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.submitButtonText}>Guardar Cambios</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  // Selector de Tipo
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
  // Inputs
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
  // Categorías
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
  // Botón de enviar
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
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
    fontSize: 10,
    fontWeight: '600',
  },
  // Filtros
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
  // Lista de Transacciones
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
  // Estado vacío
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
  // Modal
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
    maxHeight: '80%',
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
  submitButton: {
    backgroundColor: '#16a34a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});