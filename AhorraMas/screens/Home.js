import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import TransaccionController from '../controllers/transaccionController';
import UsuarioController from '../controllers/usuarioController';
import { Categorias } from '../models/transacciones';

export default function Home({ navigation }) {

  const [resumen, setResumen] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const currentUser = UsuarioController.getCurrentUser();

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Sesión no iniciada</Text>
        <TouchableOpacity 
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'AutenScreen' }],
          })}
          style={styles.loginButton}
        >
            <Text style={styles.loginButtonText}>Ir al Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Función para cargar todos los datos
  const fetchData = async () => {
    if (currentUser) {
      try {
        // Cargar Resumen
        const dataResumen = await TransaccionController.obtenerResumenMensual(currentUser.id);
        setResumen(dataResumen);

        const dataTransacciones = await TransaccionController.obtenerTransacciones(currentUser.id, 5);
        
        const transaccionesFormateadas = dataTransacciones.map(t => ({
          id: t.id.toString(),
          name: t.descripcion || t.categoria,
          amount: t.monto,
          type: t.tipo === 'ingreso' ? 'income' : 'expense',
          category: t.categoria
        }));
        setRecentTransactions(transaccionesFormateadas);

      } catch (error) {
        console.error("Error cargando Home:", error);
      }
    }
  };

  // Cargar datos cuando el screen obtiene foco
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentUser])
  );

  // Suscribirse a cambios en transacciones
  useEffect(() => {
    TransaccionController.addListener(fetchData);

    return () => {
      TransaccionController.removeListener(fetchData);
    };
  }, [currentUser]);

  const incomeData = resumen ? resumen.ingresosPorCategoria.map(item => ({
    category: item.categoria,
    amount: item.monto,
    percentage: item.porcentaje,
    color: Categorias.obtenerColor(item.categoria)
  })) : [];

  const expensesData = resumen ? resumen.gastosPorCategoria.map(item => ({
    category: item.categoria,
    amount: item.monto,
    percentage: item.porcentaje,
    color: Categorias.obtenerColor(item.categoria)
  })) : [];

  const comparisonData = {
    income: resumen ? resumen.ingresos : 0,
    expenses: resumen ? resumen.gastos : 0
  };

  const ProgressBar = ({ percentage, color, showLabel = true }) => (
    <View style={styles.progressContainer}>
      {showLabel && (
        <Text style={styles.progressPercentage}>{percentage}%</Text>
      )}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${percentage}%`,
              backgroundColor: color
            }
          ]} 
        />
      </View>
    </View>
  );

  const ComparisonChart = () => {
    const maxValue = Math.max(comparisonData.income, comparisonData.expenses) || 1; // Evitar división por 0
    const incomeHeight = (comparisonData.income / maxValue) * 120;
    const expensesHeight = (comparisonData.expenses / maxValue) * 120;

    return (
      <View style={styles.comparisonChart}>
        <View style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar,
                styles.incomeBar,
                { height: incomeHeight || 2 } // Altura mínima visual
              ]} 
            />
            <Text style={styles.barLabel}>Ingresos</Text>
            <Text style={styles.barAmount}>${(comparisonData.income / 1000).toFixed(0)}k</Text>
          </View>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar,
                styles.expenseBar,
                { height: expensesHeight || 2 } // Altura mínima visual
              ]} 
            />
            <Text style={styles.barLabel}>Gastos</Text>
            <Text style={styles.barAmount}>${(comparisonData.expenses / 1000).toFixed(0)}k</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ahorra+ App</Text>
          <Text style={styles.headerSubtitle}>Resumen Financiero</Text>
        </View>
      </SafeAreaView>
      
      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {/* Card del Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Balance Total</Text>
          <Text style={styles.balanceAmount}>${((comparisonData.income - comparisonData.expenses) / 1000).toFixed(0)}k</Text>
          <Text style={styles.balanceSubtitle}>
            {comparisonData.income > comparisonData.expenses ? '+' : '-'}$
            {Math.abs(comparisonData.income - comparisonData.expenses) / 1000}k este mes
          </Text>
        </View>

        {/* Datos rápidos */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${(comparisonData.income / 1000).toFixed(0)}k</Text>
            <Text style={styles.statLabel}>Ingresos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.expenseValue]}>${(comparisonData.expenses / 1000).toFixed(0)}k</Text>
            <Text style={styles.statLabel}>Gastos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {comparisonData.expenses > 0 
                ? Math.round((comparisonData.income / comparisonData.expenses) * 100) 
                : 100}%
            </Text>
            <Text style={styles.statLabel}>Ratio</Text>
          </View>
        </View>

        {/* Comparación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparación Ingresos vs Gastos</Text>
          <View style={{ marginTop: 10 }}>
            <ComparisonChart />
          </View>
        </View>

        {/* Ingresos por Categoría */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresos por Categoría</Text>
          {incomeData.length > 0 ? incomeData.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.category}</Text>
                </View>
                <Text style={styles.categoryAmount}>${(item.amount / 1000).toFixed(0)}k</Text>
              </View>
              <ProgressBar percentage={item.percentage} color={item.color} showLabel={false} />
            </View>
          )) : <Text style={styles.emptyText}>No hay ingresos registrados</Text>}
        </View>

        {/* Gastos por Categoría */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
          {expensesData.length > 0 ? expensesData.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.category}</Text>
                </View>
                <Text style={styles.categoryAmount}>-${(item.amount / 1000).toFixed(0)}k</Text>
              </View>
              <ProgressBar percentage={item.percentage} color={item.color} showLabel={false} />
            </View>
          )) : <Text style={styles.emptyText}>No hay gastos registrados</Text>}
        </View>

        {/* Transacciones recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Transacciones')}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount / 1000).toFixed(1)}k
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
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
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  expenseValue: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  comparisonChart: {
    alignItems: 'center',
    marginTop: 10,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    width: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    width: '40%',
  },
  bar: {
    width: 40,
    borderRadius: 8,
    marginBottom: 8,
  },
  incomeBar: {
    backgroundColor: '#10b981',
  },
  expenseBar: {
    backgroundColor: '#ef4444',
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  barAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6b7280',
    width: 30,
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionName: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#16a34a',
  },
  expenseAmount: {
    color: '#dc2626',
  },
});