// components/HistoricoMensalScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function HistoricoMensalScreen() {
  const [mesSelecionado, setMesSelecionado] = useState(null); // { label, dados }
  const [meses, setMeses] = useState({}); // { 'MM/YYYY': [lancamentos] }
  const [vh, setVh] = useState(0);
  const [faturamento, setFaturamento] = useState(0);
  const [metasAlcancadas, setMetasAlcancadas] = useState([]);

  useFocusEffect(
    useCallback(() => { carregarDados(); }, [])
  );

  async function carregarDados() {
    try {
      const calcVh = await AsyncStorage.getItem('@valorhora_calculado');
      const fat = await AsyncStorage.getItem('@valorhora_faturamento');
      const trofeusStr = await AsyncStorage.getItem('@valorhora_trofeus');
      const lancamentosStr = await AsyncStorage.getItem('@valorhora_lancamentos');

      const vhNum = calcVh ? parseFloat(calcVh) : 0;
      const fatNum = fat ? parseFloat(fat) : 0;
      setVh(vhNum);
      setFaturamento(fatNum);

      if (trofeusStr) setMetasAlcancadas(JSON.parse(trofeusStr));

      if (lancamentosStr) {
        const lancamentos = JSON.parse(lancamentosStr);
        // Agrupar por mês
        const agrupado = {};
        lancamentos.forEach(l => {
          // data salva como DD/MM/YYYY
          const partes = l.data ? l.data.split('/') : [];
          const chave = partes.length === 3 ? `${partes[1]}/${partes[2]}` : 'Sem data';
          if (!agrupado[chave]) agrupado[chave] = [];
          agrupado[chave].push(l);
        });
        setMeses(agrupado);
      }
    } catch (e) { console.log(e); }
  }

  function calcularMetricas(lancamentos) {
    const gastos = lancamentos.filter(l => l.tipo === 'gasto').reduce((a, c) => a + c.valor, 0);
    const fixos = lancamentos.filter(l => l.tipo === 'fixo').reduce((a, c) => a + c.valor, 0);
    const ganhos = lancamentos.filter(l => l.tipo === 'ganho').reduce((a, c) => a + c.valor, 0);
    const totalGasto = gastos + fixos;
    const totalEntradas = faturamento + ganhos;
    const saldo = totalEntradas - totalGasto;
    const horasPerdidas = vh > 0 ? (totalGasto / vh) : 0;
    const horasGanhas = vh > 0 ? (ganhos / vh) : 0;
    const horasLivres = vh > 0 ? Math.max(saldo / vh, 0) : 0;
    return { gastos, fixos, ganhos, totalGasto, totalEntradas, saldo, horasPerdidas, horasGanhas, horasLivres };
  }

  function labelMes(chave) {
    if (chave === 'Sem data') return chave;
    const [mm, yyyy] = chave.split('/');
    const idx = parseInt(mm, 10) - 1;
    return `${MESES[idx] || mm} ${yyyy}`;
  }

  const chavesOrdenadas = Object.keys(meses).sort((a, b) => {
    if (a === 'Sem data') return 1;
    if (b === 'Sem data') return -1;
    const [ma, ya] = a.split('/');
    const [mb, yb] = b.split('/');
    return new Date(`${yb}-${mb}-01`) - new Date(`${ya}-${ma}-01`);
  });

  if (mesSelecionado) {
    const m = calcularMetricas(mesSelecionado.lancamentos);
    const saude = m.totalEntradas > 0 ? Math.min((m.totalGasto / m.totalEntradas) * 100, 100) : 0;

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Cabeçalho */}
        <TouchableOpacity onPress={() => setMesSelecionado(null)} style={styles.btnVoltar}>
          <Ionicons name="arrow-back-outline" size={20} color="#6d54ff" />
          <Text style={styles.btnVoltarTxt}>Todos os meses</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>{mesSelecionado.label}</Text>
        <Text style={styles.sub}>Relatório completo do período</Text>

        {/* Saldo */}
        <View style={[styles.cardSaldo, { borderColor: m.saldo >= 0 ? 'rgba(0,245,155,0.3)' : 'rgba(255,82,82,0.3)' }]}>
          <Text style={styles.saldoLabel}>Saldo do Mês</Text>
          <Text style={[styles.saldoValor, { color: m.saldo >= 0 ? '#00f59b' : '#ff5252' }]}>
            {m.saldo >= 0 ? '+' : ''}R$ {m.saldo.toFixed(2)}
          </Text>
          <Text style={styles.saldoSub}>{saude.toFixed(1)}% da renda comprometida</Text>
          <View style={styles.barraFundo}>
            <View style={[styles.barraPreenchida, {
              width: `${Math.min(saude, 100)}%`,
              backgroundColor: saude > 80 ? '#ff5252' : saude > 50 ? '#ffb74d' : '#00f59b'
            }]} />
          </View>
        </View>

        {/* Grid de métricas financeiras */}
        <Text style={styles.secao}>💰 Financeiro</Text>
        <View style={styles.grid}>
          <MetricaBox label="Entradas Totais" valor={`R$ ${m.totalEntradas.toFixed(2)}`} cor="#00f59b" icone="trending-up-outline" />
          <MetricaBox label="Saídas Totais" valor={`R$ ${m.totalGasto.toFixed(2)}`} cor="#ff5252" icone="trending-down-outline" />
          <MetricaBox label="Gastos Avulsos" valor={`R$ ${m.gastos.toFixed(2)}`} cor="#ff5252" icone="cart-outline" />
          <MetricaBox label="Gastos Fixos" valor={`R$ ${m.fixos.toFixed(2)}`} cor="#ffb74d" icone="repeat-outline" />
          <MetricaBox label="Renda Extra" valor={`R$ ${m.ganhos.toFixed(2)}`} cor="#00f59b" icone="add-circle-outline" />
          <MetricaBox label="Salário Base" valor={`R$ ${faturamento.toFixed(2)}`} cor="#6d54ff" icone="wallet-outline" />
        </View>

        {/* Grid de horas */}
        <Text style={styles.secao}>⏱ Horas de Vida</Text>
        <View style={styles.grid}>
          <MetricaBox label="Horas Perdidas" valor={`${m.horasPerdidas.toFixed(1)}h`} cor="#ff5252" icone="hourglass-outline" />
          <MetricaBox label="Horas Ganhas" valor={`${m.horasGanhas.toFixed(1)}h`} cor="#00f59b" icone="pulse-outline" />
          <MetricaBox label="Horas Livres" valor={`${m.horasLivres.toFixed(1)}h`} cor="#6d54ff" icone="leaf-outline" />
          <MetricaBox label="Custo/Hora Vida" valor={`R$ ${vh.toFixed(2)}`} cor="#ffb74d" icone="flash-outline" />
        </View>

        {/* Metas alcançadas no geral (da sala de troféus) */}
        <Text style={styles.secao}>🏆 Troféus Conquistados</Text>
        {metasAlcancadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTxt}>Nenhuma meta concluída ainda.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {metasAlcancadas.map(t => (
              <View key={t.id} style={styles.trofeuCard}>
                <View style={styles.trofeuIcon}>
                  <Ionicons name="trophy" size={28} color="#ffb74d" />
                </View>
                <Text numberOfLines={2} style={styles.trofeuNome}>{t.nome}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Lançamentos do mês */}
        <Text style={styles.secao}>📋 Lançamentos do Período</Text>
        {mesSelecionado.lancamentos.map(l => {
          let cor = '#ff5252';
          if (l.tipo === 'fixo') cor = '#ffb74d';
          if (l.tipo === 'ganho') cor = '#00f59b';
          return (
            <View key={l.id} style={styles.lancItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lancDesc}>{l.desc}</Text>
                <Text style={styles.lancMeta}>
                  {vh > 0 ? (l.valor / vh).toFixed(1) : 0}h de impacto · {l.data}
                </Text>
              </View>
              <Text style={[styles.lancValor, { color: cor }]}>
                {l.tipo === 'ganho' ? '+' : '-'}R$ {parseFloat(l.valor).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // Lista de meses
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.titulo}>Histórico Mensal</Text>
      <Text style={styles.sub}>Selecione um mês para ver o relatório completo.</Text>

      {chavesOrdenadas.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={40} color="#62626e" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTxt}>Nenhum lançamento registrado ainda.</Text>
        </View>
      ) : (
        chavesOrdenadas.map(chave => {
          const m = calcularMetricas(meses[chave]);
          const saldoPos = m.saldo >= 0;
          return (
            <TouchableOpacity
              key={chave}
              style={styles.mesCard}
              onPress={() => setMesSelecionado({ label: labelMes(chave), lancamentos: meses[chave] })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.mesNome}>{labelMes(chave)}</Text>
                <Text style={styles.mesQtd}>{meses[chave].length} lançamentos</Text>
                <View style={styles.mesRow}>
                  <Text style={styles.mesGanho}>↑ R$ {m.totalEntradas.toFixed(2)}</Text>
                  <Text style={styles.mesGasto}>↓ R$ {m.totalGasto.toFixed(2)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.mesSaldo, { color: saldoPos ? '#00f59b' : '#ff5252' }]}>
                  {saldoPos ? '+' : ''}R$ {m.saldo.toFixed(2)}
                </Text>
                <Text style={styles.mesHoras}>{m.horasPerdidas.toFixed(1)}h gastas</Text>
                <Ionicons name="chevron-forward" size={16} color="#62626e" style={{ marginTop: 6 }} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

function MetricaBox({ label, valor, cor, icone }) {
  return (
    <View style={[metStyles.box, { borderColor: cor + '33' }]}>
      <Ionicons name={icone} size={16} color={cor} style={{ marginBottom: 8 }} />
      <Text style={metStyles.label}>{label}</Text>
      <Text style={[metStyles.valor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const metStyles = StyleSheet.create({
  box: {
    width: '47%', backgroundColor: '#09090b', borderRadius: 12, padding: 14,
    borderWidth: 1, marginBottom: 10,
  },
  label: { fontSize: 10, color: '#62626e', textTransform: 'uppercase', marginBottom: 4 },
  valor: { fontSize: 16, fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  btnVoltarTxt: { color: '#6d54ff', fontWeight: '600', fontSize: 14 },
  titulo: { fontSize: 26, fontWeight: '700', color: '#fafffd', marginBottom: 4 },
  sub: { fontSize: 13, color: '#62626e', marginBottom: 24 },
  secao: { fontSize: 14, fontWeight: '700', color: '#fafffd', marginTop: 24, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  cardSaldo: {
    backgroundColor: '#09090b', borderRadius: 16, padding: 20,
    borderWidth: 1, marginBottom: 10,
  },
  saldoLabel: { fontSize: 12, color: '#62626e', textTransform: 'uppercase', marginBottom: 6 },
  saldoValor: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
  saldoSub: { fontSize: 12, color: '#62626e', marginBottom: 12 },
  barraFundo: { height: 8, backgroundColor: '#1c1c21', borderRadius: 4, overflow: 'hidden' },
  barraPreenchida: { height: '100%', borderRadius: 4 },

  mesCard: {
    flexDirection: 'row', backgroundColor: '#09090b', borderRadius: 14,
    padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  mesNome: { fontSize: 16, fontWeight: '700', color: '#fafffd', marginBottom: 2 },
  mesQtd: { fontSize: 11, color: '#62626e', marginBottom: 8 },
  mesRow: { flexDirection: 'row', gap: 12 },
  mesGanho: { fontSize: 12, color: '#00f59b', fontWeight: '600' },
  mesGasto: { fontSize: 12, color: '#ff5252', fontWeight: '600' },
  mesSaldo: { fontSize: 16, fontWeight: '800' },
  mesHoras: { fontSize: 11, color: '#62626e', marginTop: 2 },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: '#62626e', fontSize: 14 },

  trofeuCard: { alignItems: 'center', marginRight: 16, width: 90 },
  trofeuIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,183,77,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,183,77,0.3)' },
  trofeuNome: { color: '#62626e', fontSize: 11, textAlign: 'center' },

  lancItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  lancDesc: { color: '#fafffd', fontSize: 14, fontWeight: '500' },
  lancMeta: { color: '#62626e', fontSize: 11, marginTop: 3 },
  lancValor: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
});