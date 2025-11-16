import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler';

import Home from './screens/Home';
import AutenScreen from './screens/AutenScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
    
  );
}
