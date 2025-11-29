import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import Home from './screens/Home';
import AutenScreen from './screens/AutenScreen';
import RecoveryScreen from './screens/RecuperacionScreen';
import Perfil from './screens/Perfil';
import Presupuestos from './screens/Presupuestos';
import Transacciones from './screens/Transacciones';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
        let inconName;

        if (route.name === 'Home') {
          inconName = 'home';
          } else if (route.name === 'Presupuestos'){
            inconName = 'wallet';
          } else if (route.name === 'Transacciones'){
            inconName = 'receipt';
          } else if (route.name === 'Perfil'){
            inconName = 'person';
          }
          return <Ionicons name={inconName} size={size} color={color} />
          }
        })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Transacciones" 
        component={Transacciones} 
        options={{ title: 'Transacciones' }}
      />
      <Tab.Screen 
        name="Presupuestos" 
        component={Presupuestos} 
        options={{ title: 'Presupuestos' }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={Perfil} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AutenScreen">
        
        <Stack.Screen 
          name="AutenScreen" 
          component={AutenScreen}
          options={{ headerShown: false }} 
        />

        <Stack.Screen
          name='RecuperacionScreen'
          component={RecoveryScreen}
          options={{ headerShown: false}}
        />  

        <Stack.Screen 
          name="Main" 
          component={BottomTabs} 
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
