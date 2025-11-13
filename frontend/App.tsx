import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Main from './src/screens/Main';
import PumpDialog from './src/screens/PumpDiolog';
import PumpSetup from './src/screens/PumpSetup';
import { PumpProvider } from './src/context/PumpContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PumpProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen 
            name="Main" 
            component={Main}
            options={{ title: 'Main Screen' }}
          />
          <Stack.Screen 
            name="PumpDialog" 
            component={PumpDialog}
            options={{ title: 'Pump Dialog' }}
          />
          <Stack.Screen 
            name="PumpSetup" 
            component={PumpSetup}
            options={{ title: 'Pump Setup' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PumpProvider>
  );
}