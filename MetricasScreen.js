// components/MetricasScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MetricasScreen() {
  const [perfil, setPerfil] = useState({ nome: '', faturamento: 0, vh: 0 });
  const [gastosAvulsos, setGastosAvulsos] = useState(0);
  const [gastosFixos, setGastosFixos] = useState(0);
  const [ganhosExtras, setGanhosExtras] = useState(0);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      const nome = await AsyncStorage.getItem('@valorhora_nome') || 'Usuário';
      const faturamento = parseFloat(await AsyncStorage.getItem('@valorhora_faturamento') || 0);
      const vh = parseFloat(await AsyncStorage.getItem('@valorhora_calculado') || 0);
      setPerfil({ nome, faturamento, vh });

      const lancamentosStr = await AsyncStorage.getItem('@valorhora_lancamentos');
      if (lancamentosStr) {
        const lancamentos = JSON.parse(lancamentosStr);
        setGastosAvulsos(lancamentos.filter(l => l.tipo === 'gasto').reduce((acc, curr) => acc + curr.valor, 0));
        setGastosFixos(lancamentos.filter(l => l.tipo === 'fixo').reduce((acc, curr) => acc + curr.valor, 0));
        setGanhosExtras(lancamentos.filter(l => l.tipo === 'ganho').reduce((acc, curr) => acc + curr.valor, 0));
      }
    } catch (e) { console.log(e); }
  }

  const ganhosTotais = perfil.faturamento + ganhosExtras;
  const despesasTotais = gastosAvulsos + gastosFixos;
  const saldoRestante = ganhosTotais - despesasTotais;

  const percentualGasto = ganhosTotais > 0 ? (despesasTotais / ganhosTotais) * 100 : 0;
  const larguraGasto = Math.min(Math.max(percentualGasto, 2), 98);

  // Horas
  const vh = perfil.vh || 1;
  const horasGastas = (despesasTotais / vh).toFixed(1);
  const horasGanhas = (ganhosExtras / vh).toFixed(1);
  const horasLivres = Math.max((saldoRestante / vh), 0).toFixed(1);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      <Text style={styles.headerSub}>Bem-vindo, {perfil.nome}</Text>

      {/* Card Valor/Hora */}
      <View style={styles.cardDestaque}>
        <Ionicons name="flash" size={24} color="#000000" style={{ marginBottom: 10 }} />
        <Text style={styles.labelDestaque}>Seu Valor Líquido / Hora</Text>
        <Text style={styles.valorDestaque}>R$ {perfil.vh.toFixed(2)}</Text>
      </View>

      {/* Cards de Horas */}
      <Text style={styles.sectionTitle}>Impacto em Horas de Vida</Text>
      <View style={styles.rowCards}>
        <View style={[styles.miniCard, { borderColor: 'rgba(255, 82, 82, 0.3)' }]}>
          <Ionicons name="hourglass-outline" size={18} color="#ff5252" style={{ marginBottom: 6 }} />
          <Text style={styles.miniCardLabel}>Horas Gastas</Text>
          <Text style={[styles.miniCardValue, { color: '#ff5252' }]}>{horasGastas}h</Text>
          <Text style={styles.miniCardTempo}>em despesas</Text>
        </View>
        <View style={[styles.miniCard, { borderColor: 'rgba(0, 245, 155, 0.3)' }]}>
          <Ionicons name="trending-up-outline" size={18} color="#00f59b" style={{ marginBottom: 6 }} />
          <Text style={styles.miniCardLabel}>Horas Ganhas</Text>
          <Text style={[styles.miniCardValue, { color: '#00f59b' }]}>{horasGanhas}h</Text>
          <Text style={styles.miniCardTempo}>em renda extra</Text>
        </View>
        <View style={[styles.miniCard, { borderColor: 'rgba(109, 84, 255, 0.3)' }]}>
          <Ionicons name="leaf-outline" size={18} color="#6d54ff" style={{ marginBottom: 6 }} />
          <Text style={styles.miniCardLabel}>Horas Livres</Text>
          <Text style={[styles.miniCardValue, { color: '#6d54ff' }]}>{horasLivres}h</Text>
          <Text style={styles.miniCardTempo}>disponíveis</Text>
        </View>
      </View>

      {/* Saúde Financeira */}
      <Text style={styles.sectionTitle}>Saúde Financeira</Text>
      <View style={styles.cardGrafico}>
        <View style={styles.graficoHeader}>
          <Text style={styles.graficoTxt}>Entradas: R$ {ganhosTotais.toFixed(2)}</Text>
          <Text style={[styles.graficoTxt, { color: '#ff5252' }]}>Saídas: R$ {despesasTotais.toFixed(2)}</Text>
        </View>

        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchida, { width: `${larguraGasto}%` }]} />
        </View>

        <View style={styles.graficoFooter}>
          <Text style={styles.percentTxt}>{percentualGasto.toFixed(1)}% Comprometido</Text>
          <Text style={styles.saldoTxt}>Livre: R$ {Math.max(saldoRestante, 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Análise de Custos */}
      <Text style={styles.sectionTitle}>Análise de Custos</Text>
      <View style={styles.rowCards}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>Custo de Vida Fixo</Text>
          <Text style={[styles.miniCardValue, { color: '#ffb74d' }]}>R$ {gastosFixos.toFixed(2)}</Text>
          <Text style={styles.miniCardTempo}>{(gastosFixos / vh).toFixed(1)}h de esforço</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>Gastos Avulsos</Text>
          <Text style={[styles.miniCardValue, { color: '#ff5252' }]}>R$ {gastosAvulsos.toFixed(2)}</Text>
          <Text style={styles.miniCardTempo}>{(gastosAvulsos / vh).toFixed(1)}h perdidas</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fafffd' },
  headerSub: { fontSize: 14, color: '#62626e', marginBottom: 25 },
  cardDestaque: { backgroundColor: '#6d54ff', borderRadius: 16, padding: 24, marginBottom: 25 },
  labelDestaque: { fontSize: 14, fontWeight: '600', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' },
  valorDestaque: { fontSize: 40, fontWeight: '900', color: '#000000', letterSpacing: -1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fafffd', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardGrafico: { backgroundColor: '#09090b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 25 },
  graficoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  graficoTxt: { color: '#fafffd', fontSize: 13, fontWeight: '600' },
  barraFundo: { height: 12, backgroundColor: '#1c1c21', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  barraPreenchida: { height: '100%', backgroundColor: '#ff5252', borderRadius: 6 },
  graficoFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  percentTxt: { color: '#62626e', fontSize: 12 },
  saldoTxt: { color: '#00f59b', fontSize: 12, fontWeight: '700' },
  rowCards: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  miniCard: { flex: 1, backgroundColor: '#09090b', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'flex-start' },
  miniCardLabel: { fontSize: 10, color: '#62626e', marginBottom: 6, textTransform: 'uppercase' },
  miniCardValue: { fontSize: 18, fontWeight: '700', color: '#fafffd' },
  miniCardTempo: { fontSize: 10, color: '#62626e', marginTop: 2 }
});