// components/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    verificarCadastro();
  }, []);

  async function verificarCadastro() {
    try {
      const nomeSalvo = await AsyncStorage.getItem('@valorhora_nome');
      setTimeout(() => {
        if (nomeSalvo) {
          navigation.replace('Main'); // Vai direto para as abas
        } else {
          navigation.replace('Onboarding'); // Abre o questionário inicial
        }
      }, 2000);
    } catch (e) { navigation.replace('Onboarding'); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Nuvly</Text>
      <ActivityIndicator size="small" color="#6d54ff" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '900', color: '#fafffd', letterSpacing: 1 }
});