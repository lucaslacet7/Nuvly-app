// components/ControleScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ControleScreen() {
  const [valorStr, setValorStr] = useState('');
  const [desc, setDesc] = useState('');
  const [tipo, setTipo] = useState('gasto'); // 'gasto', 'fixo', 'ganho'
  const [lancamentos, setLancamentos] = useState([]);
  const [vh, setVh] = useState(0);

  useFocusEffect(
    useCallback(() => { carregarDados(); }, [])
  );

  async function carregarDados() {
    const listStr = await AsyncStorage.getItem('@valorhora_lancamentos');
    if (listStr) setLancamentos(JSON.parse(listStr));
    const calcVh = await AsyncStorage.getItem('@valorhora_calculado');
    if (calcVh) setVh(parseFloat(calcVh));
  }

  async function registrar() {
    if (!valorStr || !desc) return Alert.alert("Ops", "Preencha tudo!");
    const valor = parseFloat(valorStr.replace(',', '.'));

    // Atrito de Oportunidade APENAS para gastos impulsivos (avulsos)
    if (tipo === 'gasto') {
      const metaAtivaStr = await AsyncStorage.getItem('@valorhora_meta');
      if (metaAtivaStr) {
        const meta = JSON.parse(metaAtivaStr);
        const horasPerdidas = (valor / vh).toFixed(1);
        
        Alert.alert(
          "⚖️ Atrito de Oportunidade",
          `Esta compra impulsiva custa ${horasPerdidas} horas da sua vida.\n\nDeseja abortar e guardar esses R$ ${valor} no seu cofrinho para: "${meta.nome}"?`,
          [
            { text: "Manter Gasto", onPress: () => salvarLancamento(valor) },
            { text: "Guardar no Cofre 🚀", style: "default", onPress: () => injetarNaMeta(valor) }
          ]
        );
        return; 
      }
    }
    salvarLancamento(valor);
  }

  async function injetarNaMeta(valor) {
    try {
      const progressoAtualStr = await AsyncStorage.getItem('@valorhora_progresso');
      const progressoAtual = progressoAtualStr ? parseFloat(progressoAtualStr) : 0;
      await AsyncStorage.setItem('@valorhora_progresso', (progressoAtual + valor).toString());
      Alert.alert("Sucesso!", "Sábia escolha. Dinheiro redirecionado para o seu cofrinho.");
      setValorStr(''); setDesc('');
    } catch (e) { console.log(e); }
  }

  async function salvarLancamento(valor) {
    const novo = { id: Date.now().toString(), desc, valor, tipo, data: new Date().toLocaleDateString() };
    const novaLista = [novo, ...lancamentos];
    await AsyncStorage.setItem('@valorhora_lancamentos', JSON.stringify(novaLista));
    setLancamentos(novaLista);
    setValorStr(''); setDesc('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Fluxo</Text>
      
      <View style={styles.form}>
        <View style={styles.tipoContainer}>
          <TouchableOpacity onPress={() => setTipo('gasto')} style={[styles.btnTipo, tipo === 'gasto' && styles.btnTipoGasto]}>
            <Text style={[styles.txtTipo, tipo === 'gasto' && { color: '#ff5252' }]}>Avulso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTipo('fixo')} style={[styles.btnTipo, tipo === 'fixo' && styles.btnTipoFixo]}>
            <Text style={[styles.txtTipo, tipo === 'fixo' && { color: '#ffb74d' }]}>Fixo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTipo('ganho')} style={[styles.btnTipo, tipo === 'ganho' && styles.btnTipoGanho]}>
            <Text style={[styles.txtTipo, tipo === 'ganho' && { color: '#00f59b' }]}>Ganho</Text>
          </TouchableOpacity>
        </View>

        <TextInput onChangeText={setDesc} placeholder="Netflix, Feira, Extra.." placeholderTextColor="#62626e" style={styles.input} value={desc}/>
        <TextInput keyboardType="numeric" onChangeText={setValorStr} placeholder="R$ 0.00" placeholderTextColor="#62626e" style={styles.input} value={valorStr}/>
        
        <TouchableOpacity onPress={registrar} style={styles.btnRegistrar}>
          <Text style={styles.btnRegistrarTxt}>Adicionar Registro</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historicoTitulo}>Últimos Lançamentos</Text>
      <FlatList 
        data={lancamentos} 
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          let corValor = '#ff5252'; // Padrão Gasto
          if (item.tipo === 'fixo') corValor = '#ffb74d';
          if (item.tipo === 'ganho') corValor = '#00f59b';

          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.itemDesc}>
                  {item.desc} {item.tipo === 'fixo' && <Text style={{fontSize: 10, color: '#ffb74d'}}>(Fixo)</Text>}
                </Text>
                <Text style={styles.itemTempo}>
                  {vh > 0 ? (item.valor / vh).toFixed(1) : 0}h de impacto
                </Text>
              </View>
              <Text style={[styles.itemValor, { color: corValor }]}>
                {item.tipo === 'ganho' ? '+' : '-'} R$ {item.valor.toFixed(2)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#fafffd', marginBottom: 20 },
  form: { backgroundColor: '#09090b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 30 },
  tipoContainer: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  btnTipo: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  btnTipoGasto: { borderColor: '#ff5252', backgroundColor: 'rgba(255,82,82,0.1)' },
  btnTipoFixo: { borderColor: '#ffb74d', backgroundColor: 'rgba(255,183,77,0.1)' },
  btnTipoGanho: { borderColor: '#00f59b', backgroundColor: 'rgba(0,245,155,0.1)' },
  txtTipo: { color: '#62626e', fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: '#121216', color: '#fafffd', padding: 14, borderRadius: 8, marginBottom: 12 },
  btnRegistrar: { backgroundColor: '#6d54ff', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnRegistrarTxt: { color: '#fff', fontWeight: '700' },
  historicoTitulo: { fontSize: 14, color: '#62626e', textTransform: 'uppercase', marginBottom: 15 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  itemDesc: { color: '#fafffd', fontSize: 15 },
  itemTempo: { color: '#62626e', fontSize: 12, marginTop: 4 },
  itemValor: { fontSize: 15, fontWeight: '700' }
});