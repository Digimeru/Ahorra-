import { Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useState } from 'react';

export default function AutenScreen({ navigation }) {

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (loginEmail && loginPassword) {
        navigation.navigate("Home");
      } else {
        alert("Por favor completa todos los campos");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      if (registerName && registerEmail && registerPassword && registerPhone) {
        navigation.navigate('Home');
      } else {
        alert("Por favor completa todos los campos");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cardWrapper}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>👛</Text>
          </View>
          <Text style={styles.title}>Ahorra+ App</Text>
          <Text style={styles.subtitle}>Gestiona tus finanzas personales</Text>
        </View>

        <View style={styles.tabContainer}>
          <View style={styles.tabButtons}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "login" && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab("login")}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "login" && styles.tabButtonTextActive,
                ]}
              >
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "register" && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab("register")}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "register" && styles.tabButtonTextActive,
                ]}
              >
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "login" && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Iniciar Sesión</Text>
                <Text style={styles.cardDescription}>Ingresa tus credenciales para acceder</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={true}
                      editable={!isLoading}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Cargando..." : "Iniciar Sesión"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {activeTab === "register" && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Crear Cuenta</Text>
                <Text style={styles.cardDescription}>Completa el formulario para registrarte</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre y Apellido"
                      value={registerName}
                      onChangeText={setRegisterName}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      value={registerEmail}
                      onChangeText={setRegisterEmail}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={registerPassword}
                      onChangeText={setRegisterPassword}
                      secureTextEntry={true}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+56 9 1234 5678"
                      value={registerPhone}
                      onChangeText={setRegisterPhone}
                      editable={!isLoading}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Cargando..." : "Crear Cuenta"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    color: "#16a34a",
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 14,
  },
  tabContainer: {
    width: "100%",
  },
  tabButtons: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: "#fff",
  },
  tabButtonText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

