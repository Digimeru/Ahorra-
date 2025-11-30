import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,KeyboardAvoidingView,Platform,ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UsuarioController  from '../controllers/usuarioController';

export default function RecoveryScreen({ navigation }) {
  const [step, setStep] = useState(1); 
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async () => {
    if (!email) { Alert.alert('Error', 'Escribe tu correo electrónico'); return; }
    
    setIsLoading(true);
    try {

      const usuario = await UsuarioController.buscarUsuarioPorEmail(email);
      setUserId(usuario.id);

      // Generar un código aleatorio y se muestra en la consola 
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      
      console.log(' CÓDIGO DE RECUPERACIÓN:', code);

      Alert.alert(
        'Código Enviado', 
        'Revisa tu computadora para ver el código de seguridad.',
        [{ text: 'Ingresar Código', onPress: () => setStep(2) }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (inputCode === generatedCode) {
      setStep(3); 
    } else {
      Alert.alert('Error', 'Código incorrecto. Revisa tu log.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Las contraseñas no coinciden'); return; }

    setIsLoading(true);
    try {
      await UsuarioController.cambiarPassword(userId, newPassword, confirmPassword);
      Alert.alert('¡Éxito!', 'Contraseña actualizada correctamente.', [
        { text: 'Iniciar Sesión', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open" size={40} color="#16a34a" />
            </View>
            <Text style={styles.title}>Recupera tu Contraseña</Text>
            <Text style={styles.subtitle}>Escribe tu correo electrónico para restablecer tu contraseña.</Text>
          </View>

          <View style={styles.form}>

          {step === 1 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSendCode} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Buscando...' : 'Enviar Código'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Código de Verificación</Text>
                <TextInput
                  style={[styles.input, {textAlign: 'center', letterSpacing: 5, fontSize: 24}]}
                  placeholder="0000"
                  value={inputCode}
                  onChangeText={setInputCode}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={{textAlign:'center', marginTop:10, color:'#666', fontStyle:'italic'}}>
                  (Mira el código en la consola del editor)
                </Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
                <Text style={styles.buttonText}>Verificar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nueva Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleChangePassword} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Guardando...' : 'Actualizar Contraseña'}</Text>
              </TouchableOpacity>
            </>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dcfce7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
