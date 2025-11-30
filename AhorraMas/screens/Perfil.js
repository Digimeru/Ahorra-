import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import  UsuarioController  from '../controllers/usuarioController';
import { useFocusEffect } from '@react-navigation/native'; 

export default function Perfil({ navigation }) {
  // Datos del usuario
  const currentUser = UsuarioController.getCurrentUser();
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: 'No registrado'
  });
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        if (!currentUser) {
          navigation.reset({ index: 0, routes: [{ name: 'AutenScreen' }] });
          return;
        }

        // Cargar datos del usuario y preferencias
        setUser({
          name: currentUser.nombre,
          email: currentUser.email,
          phone: 'No registrado'
        });

        setEditName(currentUser.nombre || '');

        try {
          const prefs = await UsuarioController.obtenerPreferencias(currentUser.id);
          if (!mounted) return;
          // Notificaciones
          if (prefs.notifications) {
            setNotifications(prefs.notifications);
          }
          // Moneda
          if (prefs.currency) {
            setSelectedCurrency(prefs.currency);
          }
        } catch (e) {
          // ignore
        }
      };
      load();
      return () => { mounted = false; };
    }, [currentUser])
  );

  // Estados para los modales
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [notificationsModal, setNotificationsModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [reportsModal, setReportsModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);

  // Estados para formularios
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('MXN');
  const [reportFrequency, setReportFrequency] = useState('mensual');
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    expenseAlerts: true,
    monthlyReports: false,
    securityAlerts: true
  });

  // Funciones para manejar cambios
  const handleSaveProfile = async () => {
    try {
      if (!currentUser) return;

      const usuarioActualizado = await UsuarioController.editarPerfil(
        currentUser.id, 
        editName, 
        currentUser.email 
      );


      // Obtener preferencias existentes y mantenerlas
      const prefs = await UsuarioController.obtenerPreferencias(currentUser.id);
      UsuarioController.setCurrentUser({ ...usuarioActualizado, settings: prefs });

      setUser({
        ...user,
        name: usuarioActualizado.nombre,
        phone: editPhone 
      });

      setEditProfileModal(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar: ' + error.message);
    }
  };

  const handleChangePassword = () => {
    (async () => {
      try {
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }
        if (newPassword.length < 6) {
          Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (!currentUser) return;

        const usuarioActualizado = await UsuarioController.cambiarPassword(currentUser.id, newPassword, confirmPassword);
        // Mantener preferencias
        const prefs = await UsuarioController.obtenerPreferencias(currentUser.id);
        UsuarioController.setCurrentUser({ ...usuarioActualizado, settings: prefs });

        setSecurityModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Éxito', 'Contraseña cambiada correctamente');
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
      }
    })();
  };

  const handleSaveNotifications = () => {
    (async () => {
      try {
        if (!currentUser) return;
        await UsuarioController.actualizarPreferencias(currentUser.id, { notifications });
        setNotificationsModal(false);
        Alert.alert('Éxito', 'Preferencias de notificaciones guardadas');
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudieron guardar las notificaciones');
      }
    })();
  };

  const handleSaveCurrency = () => {
    (async () => {
      try {
        if (!currentUser) return;
        await UsuarioController.actualizarPreferencias(currentUser.id, { currency: selectedCurrency });
        setCurrencyModal(false);
        Alert.alert('Éxito', 'Moneda actualizada correctamente');
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo actualizar la moneda');
      }
    })();
  };

  const handleExportData = () => {
    setExportModal(false);
    Alert.alert('Éxito', 'Datos exportados correctamente');
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Modal de Editar Perfil
  const EditProfileModal = () => (
    <Modal
      visible={editProfileModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setEditProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          
          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ingresa tu nombre"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user.email}
                editable={false}
              />
              <Text style={styles.helperText}>El correo no se puede modificar</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.submitButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de Seguridad
  const SecurityModal = () => (
    <Modal
      visible={securityModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSecurityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
          
          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Contraseña Actual</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Ingresa tu contraseña actual"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Ingresa nueva contraseña"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirma tu nueva contraseña"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setSecurityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de Notificaciones
  const NotificationsModal = () => (
    <Modal
      visible={notificationsModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setNotificationsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Configurar Notificaciones</Text>
          
          <View style={styles.form}>
            <Text style={styles.sectionSubtitle}>Alertas y Recordatorios</Text>
            
            {Object.entries(notifications).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={styles.switchRow}
                onPress={() => toggleNotification(key)}
              >
                <View style={[styles.switch, value && styles.switchActive]}>
                  <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setNotificationsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSaveNotifications}
              >
                <Text style={styles.submitButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de Moneda
  const CurrencyModal = () => (
    <Modal
      visible={currencyModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setCurrencyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Moneda</Text>
          
          <View style={styles.form}>
            <Text style={styles.sectionSubtitle}>Elige tu moneda principal</Text>
            
            {['MXN', 'USD', 'EUR', 'CLP'].map(currency => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyOption,
                  selectedCurrency === currency && styles.currencyOptionSelected
                ]}
                onPress={() => setSelectedCurrency(currency)}
              >
                <Text style={[
                  styles.currencyText,
                  selectedCurrency === currency && styles.currencyTextSelected
                ]}>
                  {currency === 'MXN' && 'Peso Mexicano (MXN)'}
                  {currency === 'USD' && 'Dólar Americano (USD)'}
                  {currency === 'EUR' && 'Euro (EUR)'}
                  {currency === 'CLP' && 'Peso Chileno (CLP)'}
                </Text>
                {selectedCurrency === currency && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setCurrencyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSaveCurrency}
              >
                <Text style={styles.submitButtonText}>Seleccionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header - Pegado arriba */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Información de tu cuenta</Text>
        </View>
      </SafeAreaView>
      
      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {/* Tarjeta de Información del Usuario */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Perfil de Usuario</Text>
          
          <View style={styles.profileInfo}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Correo electrónico</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Configuración y Opciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setEditProfileModal(true)}
          >
            <Text style={styles.optionIcon}>✏️</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Editar Perfil</Text>
              <Text style={styles.optionDescription}>Actualiza tu información personal</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setSecurityModal(true)}
          >
            <Text style={styles.optionIcon}>🔒</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Seguridad</Text>
              <Text style={styles.optionDescription}>Cambia tu contraseña</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Acciones Importantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity 
            style={[styles.optionButton, styles.logoutButton]}
            onPress={() => {
              // Cerrar sesión segura: limpiar usuario en el controlador y reset navigation
              UsuarioController.logout();
              navigation.reset({ index: 0, routes: [{ name: 'AutenScreen' }] });
            }}
          >
            <Text style={styles.optionIcon}>🚪</Text>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, styles.logoutText]}>Cerrar Sesión</Text>
              <Text style={styles.optionDescription}>Salir de tu cuenta</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Renderizar todos los modales */}
      <EditProfileModal />
      <SecurityModal />
      <NotificationsModal />
      <CurrencyModal />
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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileInfo: {
    gap: 20,
  },
  infoField: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionArrow: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  exportButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#dc2626',
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  // Switch Styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#16a34a',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  // Currency and Report Options
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  currencyOptionSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  currencyText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  currencyTextSelected: {
    color: '#ffffff',
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  reportOptionSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  reportText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  reportTextSelected: {
    color: '#ffffff',
  },
  checkmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Export Options
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exportIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  exportContent: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  exportDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Buttons
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