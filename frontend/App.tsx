import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Main from './src/screens/Main';
import PumpDialog from './src/screens/PumpDiolog';
import PumpSetup from './src/screens/PumpSetup';
import { PumpProvider } from './src/context/PumpContext';
import strings from './src/localize/string';

const Stack = createNativeStackNavigator();

export default function App() {
  const [currentLanguage, setCurrentLanguage] = React.useState('en');
  const [languagePickerVisible, setLanguagePickerVisible] = React.useState(false);

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'fi', flag: '🇫🇮', name: 'Suomi' },
    { code: 'vie', flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    {code: 'sin', flag: '🇱🇰', name: 'සිංහල' },
  ];

  const selectLanguage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    strings.setLanguage(languageCode);
    setLanguagePickerVisible(false);
  };

  const getCurrentLanguageFlag = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.flag : '🌐';
  };

  return (
    <PumpProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen 
            name="Main" 
            component={Main}
            options={{
              title: 'Main Screen',
              headerRight: () => (
                <TouchableOpacity 
                  style={styles.languageButton}
                  onPress={() => setLanguagePickerVisible(true)}
                >
                  <Text style={styles.languageButtonText}>
                    {getCurrentLanguageFlag()} {currentLanguage.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ),
            }}
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

      <Modal
        visible={languagePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguagePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguagePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{strings.languagePicker.selectLanguage} / Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    currentLanguage === item.code && styles.languageItemSelected,
                  ]}
                  onPress={() => selectLanguage(item.code)}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text style={styles.languageName}>{item.name}</Text>
                  {currentLanguage === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </PumpProvider>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});