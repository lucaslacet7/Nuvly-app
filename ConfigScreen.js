import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ConfigScreen({ onReset }) {
  const [nome, setNome] = useState('...');
  const [faturamento, setFaturamento] = useState('0');
  const [regime, setRegime] = useState('...');
  const [horasDiarias, setHorasDiarias] = useState('0');
  const [valorHora, setValorHora] = useState('0.00');

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const n = await AsyncStorage.getItem('@valorhora_nome');
      const f = await AsyncStorage.getItem('@valorhora_faturamento');
      const r = await AsyncStorage.getItem('@valorhora_regime');
      const hMensal = await AsyncStorage.getItem('@valorhora_horas');
      const vh = await AsyncStorage.getItem('@valorhora_calculado');

      if (n) setNome(n);
      if (f) setFaturamento(parseFloat(f).toFixed(2));
      if (r) setRegime(r);
      if (hMensal) {
        const diarias = parseFloat(hMensal) / 22;
        setHorasDiarias(diarias.toFixed(1));
      }
      if (vh) setValorHora(parseFloat(vh).toFixed(2));
    } catch (e) {
      console.log(e);
    }
  }

  function confirmarReset() {
    Alert.alert(
      "Alerta de Segurança",
      "Isso apagará seu perfil, fluxo de caixa e progresso de desejos. Deseja redefinir o ecossistema?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, apagar tudo",
          style: "destructive",
          onPress: onReset,
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.titulo}>Painel de Controle</Text>
      <Text style={styles.sub}>Gerencie as diretrizes do seu perfil financeiro.</Text>

      <View style={styles.perfilCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#6d54ff" />
        </View>
        <Text style={styles.nomeTxt}>{nome}</Text>
        <Text style={styles.tagline}>ECOSSISTEMA ATIVO • NÍVEL OLED</Text>
      </View>

      <Text style={styles.secaoTitulo}>Parâmetros Atuais</Text>

      <View style={styles.dadosContainer}>
        <View style={styles.dadoRow}>
          <View style={styles.dadoIconBg}>
            <Ionicons name="cash-outline" size={18} color="#00f59b" />
          </View>
          <View style={styles.dadoInfo}>
            <Text style={styles.dadoLabel}>Renda Base (Bruta)</Text>
            <Text style={styles.dadoValor}>R$ {faturamento}</Text>
          </View>
        </View>

        <View style={styles.dadoRow}>
          <View style={styles.dadoIconBg}>
            <Ionicons name="briefcase-outline" size={18} color="#00e5ff" />
          </View>
          <View style={styles.dadoInfo}>
            <Text style={styles.dadoLabel}>Modelo de Contrato</Text>
            <Text style={styles.dadoValor}>{regime}</Text>
          </View>
        </View>

        <View style={styles.dadoRow}>
          <View style={styles.dadoIconBg}>
            <Ionicons name="time-outline" size={18} color="#ffb74d" />
          </View>
          <View style={styles.dadoInfo}>
            <Text style={styles.dadoLabel}>Esforço Diário Declarado</Text>
            <Text style={styles.dadoValor}>{horasDiarias} Horas / dia</Text>
          </View>
        </View>

        <View style={[styles.dadoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.dadoIconBg}>
            <Ionicons name="flash-outline" size={18} color="#6d54ff" />
          </View>
          <View style={styles.dadoInfo}>
            <Text style={styles.dadoLabel}>Seu Valor / Hora Líquido</Text>
            <Text style={styles.dadoValorEspecial}>R$ {valorHora}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.secaoTitulo, { marginTop: 30, color: '#ff5252' }]}>Zona de Perigo</Text>

      <Pressable
        onPress={confirmarReset}
        style={({ pressed }) => [
          styles.btnDanger,
          pressed && { opacity: 0.6 }
        ]}
      >
        <Ionicons name="warning-outline" size={20} color="#ff5252" />
        <Text style={styles.btnDangerTxt}>Redefinir Ecossistema (Apagar Dados)</Text>
      </Pressable>

      <Text style={styles.notaRodape}>
        Nuvly v1.0 • Os dados são criptografados e salvos localmente no seu dispositivo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20, paddingTop: 40 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fafffd' },
  sub: { fontSize: 13, color: '#62626e', marginBottom: 25, marginTop: 4, lineHeight: 18 },

  perfilCard: { backgroundColor: '#09090b', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 30 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(109, 84, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#6d54ff' },
  nomeTxt: { fontSize: 20, fontWeight: '700', color: '#fafffd', marginBottom: 4 },
  tagline: { fontSize: 10, fontWeight: '700', color: '#6d54ff', letterSpacing: 1 },

  secaoTitulo: { fontSize: 14, fontWeight: '700', color: '#fafffd', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },

  dadosContainer: { backgroundColor: '#09090b', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 20 },
  dadoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  dadoIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#121216', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  dadoInfo: { flex: 1 },
  dadoLabel: { fontSize: 12, color: '#62626e', marginBottom: 2 },
  dadoValor: { fontSize: 15, fontWeight: '600', color: '#fafffd' },
  dadoValorEspecial: { fontSize: 16, fontWeight: '800', color: '#6d54ff' },

  btnDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 82, 82, 0.1)', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.3)', gap: 10 },
  btnDangerTxt: { color: '#ff5252', fontWeight: '600', fontSize: 14 },

  notaRodape: { textAlign: 'center', fontSize: 11, color: '#62626e', marginTop: 30 },
});