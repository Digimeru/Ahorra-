import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler';

import Home from './screens/Home';
import AutenScreen from './screens/AutenScreen';
import Perfil from './screens/Perfil';
import Presupuestos from './screens/Presupuestos';
import Transacciones from './screens/Transacciones';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AutenScreen">
        <Stack.Screen 
          name="AutenScreen" 
          component={AutenScreen} 
          options={{ title: 'Authentication' }}
        />
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={{ title: 'Home Page' }}
        />
        <Stack.Screen 
          name="Perfil" 
          component={Perfil} 
          options={{ title: 'Perfil' }}
        />
        <Stack.Screen 
          name="Presupuestos" 
          component={Presupuestos} 
          options={{ title: 'Presupuestos' }}
        />
        <Stack.Screen 
          name="Transacciones" 
          component={Transacciones} 
          options={{ title: 'Transacciones' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    
  );
}
