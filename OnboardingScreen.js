// components/OnboardingScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [regime, setRegime] = useState(''); 
  const [horasTrabalhadas, setHorasTrabalhadas] = useState(''); // Agora representa horas por DIA
  
  const [passo, setPasso] = useState(0); 

  function avancarPasso() {
    if (passo === 1 && !nome.trim()) return Alert.alert("Ops!", "Por favor, diga-nos seu nome.");
    if (passo === 2 && (!faturamento || isNaN(parseFloat(faturamento)))) return Alert.alert("Ops!", "Insira um faturamento válido.");
    if (passo === 3 && !regime) return Alert.alert("Ops!", "Selecione a sua categoria.");
    if (passo === 4) {
      if (!horasTrabalhadas || isNaN(parseFloat(horasTrabalhadas)) || parseFloat(horasTrabalhadas) <= 0 || parseFloat(horasTrabalhadas) > 24) {
        return Alert.alert("Ops!", "Insira uma carga horária diária válida (ex: 8).");
      }
      finalizarConfiguração();
      return;
    }
    setPasso(passo + 1);
  }

  async function finalizarConfiguração() {
    try {
      await AsyncStorage.setItem('@valorhora_nome', nome);
      await AsyncStorage.setItem('@valorhora_faturamento', faturamento);
      await AsyncStorage.setItem('@valorhora_regime', regime);
      
      // Multiplica as horas diárias por 22 (média de dias úteis no mês) para manter a coerência da Dashboard
      const horasDiarias = parseFloat(horasTrabalhadas);
      const horasMensais = horasDiarias * 22; 
      await AsyncStorage.setItem('@valorhora_horas', horasMensais.toString());
      
      // Calcula o valor hora inicial líquido estimado
      let bruto = parseFloat(faturamento);
      if (regime === 'PJ') bruto = bruto * 0.94;
      if (regime === 'CLT') bruto = bruto * 0.85;
      const vh = bruto / horasMensais;
      
      await AsyncStorage.setItem('@valorhora_calculado', vh.toString());
      
      // Aciona a função replace passada pelo App.js para destravar a tela
      navigation.replace('Main');
    } catch (e) { console.log(e); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {passo === 0 && (
        <View style={styles.centerBlock}>
          <Ionicons name="pulse-outline" size={70} color="#6d54ff" style={{ marginBottom: 16 }} />
          <Text style={styles.welcomeTitle}>Nuvly</Text>
          <Text style={styles.tagline}>A engenharia matemática por trás do seu tempo e dinheiro.</Text>
          
          <TouchableOpacity style={styles.btnComeçar} onPress={() => setPasso(1)}>
            <Text style={styles.btnTxt}>Configurar Perfil ⚡</Text>
          </TouchableOpacity>
        </View>
      )}

      {passo > 0 && (
        <View style={styles.card}>
          <Text style={styles.stepIndicator}>Passo {passo} de 4</Text>

          {passo === 1 && (
            <View>
              <Text style={styles.perguntaTxt}>Como podemos te chamar?</Text>
              <TextInput style={styles.input} placeholder="Seu nome ou apelido" placeholderTextColor="#62626e" value={nome} onChangeText={setNome} autoFocus />
            </View>
          )}

          {passo === 2 && (
            <View>
              <Text style={styles.perguntaTxt}>Qual o seu faturamento ou salário bruto mensal?</Text>
              <TextInput style={styles.input} placeholder="R$ 0,00" placeholderTextColor="#62626e" keyboardType="numeric" value={faturamento} onChangeText={setFaturamento} autoFocus />
            </View>
          )}

          {passo === 3 && (
            <View>
              <Text style={styles.perguntaTxt}>Qual é o seu regime de contratação?</Text>
              <View style={styles.grupoBotoes}>
                {['CLT', 'PJ', 'Autônomo'].map((tipo) => (
                  <TouchableOpacity key={tipo} style={[styles.btnSeletor, regime === tipo && styles.btnSeletorAtivo]} onPress={() => setRegime(tipo)}>
                    <Text style={[styles.btnSeletorTxt, regime === tipo && styles.btnSeletorTxtAtivo]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {passo === 4 && (
            <View>
              <Text style={styles.perguntaTxt}>Quantas horas você trabalha por dia?</Text>
              <TextInput style={styles.input} placeholder="Ex: 8" placeholderTextColor="#62626e" keyboardType="numeric" value={horasTrabalhadas} onChangeText={setHorasTrabalhadas} autoFocus />
            </View>
          )}

          <TouchableOpacity style={styles.btnPrincipal} onPress={avancarPasso}>
            <Text style={styles.btnTxt}>{passo === 4 ? 'Inicializar Ecossistema' : 'Continuar →'}</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  contentContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  centerBlock: { alignItems: 'center' },
  welcomeTitle: { fontSize: 36, fontWeight: '900', color: '#fafffd', letterSpacing: -1 },
  tagline: { fontSize: 14, color: '#9090a1', textAlign: 'center', marginTop: 8, marginBottom: 40, paddingHorizontal: 10 },
  btnComeçar: { backgroundColor: '#6d54ff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  
  card: { backgroundColor: '#09090b', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  stepIndicator: { fontSize: 11, fontWeight: '700', color: '#6d54ff', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  perguntaTxt: { fontSize: 18, fontWeight: '600', color: '#fafffd', marginBottom: 20, lineHeight: 24 },
  input: { backgroundColor: '#121216', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 16, color: '#fafffd' },
  btnPrincipal: { backgroundColor: '#6d54ff', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  grupoBotoes: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  btnSeletor: { flex: 1, backgroundColor: '#121216', padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  btnSeletorAtivo: { backgroundColor: 'rgba(109, 84, 255, 0.15)', borderColor: '#6d54ff' },
  btnSeletorTxt: { color: '#9090a1', fontWeight: '500' },
  btnSeletorTxtAtivo: { color: '#fafffd', fontWeight: '700' }
});