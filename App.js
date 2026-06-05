import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './components/OnboardingScreen';
import Navigator from './components/Navigator';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [usuarioCadastrado, setUsuarioCadastrado] = useState(false);

  useEffect(() => {
    verificarStatusUsuario();
  }, []);

  async function verificarStatusUsuario() {
    try {
      const nomeSalvo = await AsyncStorage.getItem('@valorhora_nome');
      if (nomeSalvo) {
        setUsuarioCadastrado(true);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setTimeout(() => {
        setCarregando(false);
      }, 1500);
    }
  }

  async function resetarEcossistema() {
    try {
      await AsyncStorage.clear();
      setUsuarioCadastrado(false);
    } catch (e) {
      console.log(e);
    }
  }

  if (carregando) {
    return (
      <View style={styles.containerSplash}>
        <ActivityIndicator size="large" color="#6d54ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {usuarioCadastrado ? (
        <Navigator onReset={resetarEcossistema} />
      ) : (
        <OnboardingScreen
          navigation={{
            replace: () => setUsuarioCadastrado(true)
          }}
        />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  containerSplash: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});