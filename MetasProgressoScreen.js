// components/MetasProgressoScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MetasProgressoScreen() {
  // ── Desejos ──────────────────────────────────────────────
  const [meta, setMeta] = useState(null);
  const [progresso, setProgresso] = useState(0);
  const [trofeus, setTrofeus] = useState([]);
  const [novaMetaNome, setNovaMetaNome] = useState('');
  const [novaMetaValor, setNovaMetaValor] = useState('');
  const [novaMetaImg, setNovaMetaImg] = useState('');
  const [valorDeposito, setValorDeposito] = useState('');

  // ── Dívidas ───────────────────────────────────────────────
  const [dividas, setDividas] = useState([]);
  const [modalDivida, setModalDivida] = useState(false);
  const [modalPagar, setModalPagar] = useState(null); // dívida sendo paga
  const [novaDividaNome, setNovaDividaNome] = useState('');
  const [novaDividaTotal, setNovaDividaTotal] = useState('');
  const [novaDividaParcelas, setNovaDividaParcelas] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');

  const [vh, setVh] = useState(0);

  useFocusEffect(
    useCallback(() => { carregarTudo(); }, [])
  );

  async function carregarTudo() {
    try {
      const metaStr = await AsyncStorage.getItem('@valorhora_meta');
      const prog = await AsyncStorage.getItem('@valorhora_progresso');
      const calcVh = await AsyncStorage.getItem('@valorhora_calculado');
      const trofeusStr = await AsyncStorage.getItem('@valorhora_trofeus');
      const dividasStr = await AsyncStorage.getItem('@valorhora_dividas');

      if (metaStr) setMeta(JSON.parse(metaStr));
      if (prog) setProgresso(parseFloat(prog));
      if (calcVh) setVh(parseFloat(calcVh));
      if (trofeusStr) setTrofeus(JSON.parse(trofeusStr));
      if (dividasStr) setDividas(JSON.parse(dividasStr));
    } catch (e) { console.log(e); }
  }

  // ── Desejos ──────────────────────────────────────────────
  async function criarMeta() {
    if (!novaMetaNome || !novaMetaValor) return Alert.alert("Ops", "Preencha o nome e o valor!");
    const obj = {
      nome: novaMetaNome,
      valor: parseFloat(novaMetaValor.replace(',', '.')),
      img: novaMetaImg || 'https://via.placeholder.com/300'
    };
    await AsyncStorage.setItem('@valorhora_meta', JSON.stringify(obj));
    await AsyncStorage.setItem('@valorhora_progresso', '0');
    setMeta(obj); setProgresso(0);
    setNovaMetaNome(''); setNovaMetaValor(''); setNovaMetaImg('');
  }

  async function depositarCofrinho() {
    if (!valorDeposito) return Alert.alert("Aviso", "Digite um valor para guardar.");
    const valorNum = parseFloat(valorDeposito.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return Alert.alert("Erro", "Valor inválido.");
    const novoProgresso = progresso + valorNum;
    await AsyncStorage.setItem('@valorhora_progresso', novoProgresso.toString());
    setProgresso(novoProgresso);
    setValorDeposito('');
  }

  async function concluirMeta() {
    const novoTrofeu = { id: Date.now().toString(), nome: meta.nome, img: meta.img };
    const novaGaleria = [novoTrofeu, ...trofeus];
    await AsyncStorage.setItem('@valorhora_trofeus', JSON.stringify(novaGaleria));
    await AsyncStorage.removeItem('@valorhora_meta');
    await AsyncStorage.removeItem('@valorhora_progresso');
    setTrofeus(novaGaleria); setMeta(null); setProgresso(0);
    Alert.alert("Parabéns!", "Desejo materializado e enviado para a Sala de Troféus!");
  }

  // ── Dívidas ───────────────────────────────────────────────
  async function criarDivida() {
    if (!novaDividaNome || !novaDividaTotal) return Alert.alert("Ops", "Preencha nome e valor total.");
    const total = parseFloat(novaDividaTotal.replace(',', '.'));
    const parcelas = novaDividaParcelas ? parseInt(novaDividaParcelas) : null;
    const nova = {
      id: Date.now().toString(),
      nome: novaDividaNome,
      total,
      pago: 0,
      parcelas,
      criadaEm: new Date().toLocaleDateString()
    };
    const novaLista = [nova, ...dividas];
    await AsyncStorage.setItem('@valorhora_dividas', JSON.stringify(novaLista));
    setDividas(novaLista);
    setNovaDividaNome(''); setNovaDividaTotal(''); setNovaDividaParcelas('');
    setModalDivida(false);
  }

  async function registrarPagamento() {
    if (!valorPagamento) return Alert.alert("Aviso", "Digite o valor do pagamento.");
    const valor = parseFloat(valorPagamento.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) return Alert.alert("Erro", "Valor inválido.");

    const atualizadas = dividas.map(d => {
      if (d.id !== modalPagar.id) return d;
      const novoPago = Math.min(d.pago + valor, d.total);
      return { ...d, pago: novoPago };
    });

    await AsyncStorage.setItem('@valorhora_dividas', JSON.stringify(atualizadas));
    setDividas(atualizadas);
    setValorPagamento('');
    setModalPagar(null);

    const dividaAtualizada = atualizadas.find(d => d.id === modalPagar.id);
    if (dividaAtualizada.pago >= dividaAtualizada.total) {
      Alert.alert("🎉 Dívida Quitada!", `"${dividaAtualizada.nome}" foi totalmente paga!`);
    }
  }

  async function excluirDivida(id) {
    Alert.alert("Excluir Dívida", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          const nova = dividas.filter(d => d.id !== id);
          await AsyncStorage.setItem('@valorhora_dividas', JSON.stringify(nova));
          setDividas(nova);
        }
      }
    ]);
  }

  const horasTotais = meta && vh > 0 ? (meta.valor / vh) : 0;
  const horasFeitas = vh > 0 ? (progresso / vh) : 0;
  const opacidade = meta ? Math.min(Math.max(progresso / meta.valor, 0.1), 1) : 0.1;

  const totalDividas = dividas.reduce((a, d) => a + (d.total - d.pago), 0);
  const horasDividas = vh > 0 ? (totalDividas / vh) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.titulo}>Desejos & Dívidas</Text>

      {/* ── SEÇÃO DESEJOS ── */}
      <Text style={styles.secaoTitulo}>🎯 Cofrinho de Desejos</Text>

      {!meta ? (
        <View style={styles.card}>
          <Text style={styles.sub}>Crie seu próximo cofrinho</Text>
          <TextInput onChangeText={setNovaMetaNome} value={novaMetaNome} placeholder="Ex: Viagem, Tênis..." placeholderTextColor="#62626e" style={styles.input} />
          <TextInput keyboardType="numeric" onChangeText={setNovaMetaValor} value={novaMetaValor} placeholder="Valor Total (R$)" placeholderTextColor="#62626e" style={styles.input} />
          <TextInput onChangeText={setNovaMetaImg} value={novaMetaImg} placeholder="URL da Imagem (opcional)" placeholderTextColor="#62626e" style={styles.input} />
          <TouchableOpacity onPress={criarMeta} style={styles.btn}>
            <Text style={styles.btnTxt}>Iniciar Cofrinho</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.focoContainer}>
          <View style={styles.imagemContainer}>
            <Image source={{ uri: meta.img }} blurRadius={opacidade === 1 ? 0 : 3} style={[styles.imagemDesejo, { opacity: opacidade }]} />
            <View style={styles.overlayText}>
              <Text style={styles.porcentagem}>{((progresso / meta.valor) * 100).toFixed(0)}%</Text>
            </View>
          </View>
          <Text style={styles.nomeDesejo}>{meta.nome}</Text>
          <Text style={styles.dadosGerais}>Saldo: R$ {progresso.toFixed(2)} / R$ {meta.valor.toFixed(2)}</Text>
          <Text style={styles.dadosProgresso}>Equivalente a {horasFeitas.toFixed(1)}h / {horasTotais.toFixed(1)}h de esforço</Text>

          {progresso >= meta.valor ? (
            <TouchableOpacity onPress={concluirMeta} style={[styles.btn, { backgroundColor: '#00f59b', width: '100%' }]}>
              <Text style={[styles.btnTxt, { color: '#000' }]}>Materializar e Guardar Troféu</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.areaDeposito}>
              <TextInput
                keyboardType="numeric"
                onChangeText={setValorDeposito}
                value={valorDeposito}
                placeholder="R$ para guardar"
                placeholderTextColor="#62626e"
                style={styles.inputDeposito}
              />
              <TouchableOpacity onPress={depositarCofrinho} style={styles.btnAcao}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.btnTxt}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Sala de Troféus */}
      {trofeus.length > 0 && (
        <View style={styles.trofeusSection}>
          <Text style={styles.trofeusTitulo}>🏆 Sala de Troféus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {trofeus.map(t => (
              <View key={t.id} style={styles.trofeuCard}>
                <Image source={{ uri: t.img }} style={styles.trofeuImg} />
                <Text numberOfLines={1} style={styles.trofeuNome}>{t.nome}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── SEÇÃO DÍVIDAS ── */}
      <View style={styles.dividasTopo}>
        <Text style={styles.secaoTitulo}>💳 Controle de Dívidas</Text>
        <TouchableOpacity onPress={() => setModalDivida(true)} style={styles.btnNovaDivida}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Resumo geral de dívidas */}
      {dividas.length > 0 && (
        <View style={styles.resumoDividas}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumoLabel}>Total em Aberto</Text>
            <Text style={styles.resumoValor}>R$ {totalDividas.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.resumoLabel}>Horas Comprometidas</Text>
            <Text style={[styles.resumoValor, { color: '#ff5252' }]}>{horasDividas.toFixed(1)}h</Text>
          </View>
        </View>
      )}

      {dividas.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-circle-outline" size={36} color="#00f59b" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTxt}>Nenhuma dívida registrada. Parabéns!</Text>
        </View>
      ) : (
        dividas.map(d => {
          const restante = d.total - d.pago;
          const pct = Math.min((d.pago / d.total) * 100, 100);
          const horasD = vh > 0 ? (restante / vh) : 0;
          const quitada = restante <= 0;
          return (
            <View key={d.id} style={[styles.dividaCard, quitada && { borderColor: 'rgba(0,245,155,0.3)' }]}>
              <View style={styles.dividaHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dividaNome}>{d.nome}</Text>
                  {d.parcelas && <Text style={styles.dividaSub}>Em {d.parcelas}x · desde {d.criadaEm}</Text>}
                </View>
                {quitada ? (
                  <Ionicons name="checkmark-circle" size={22} color="#00f59b" />
                ) : (
                  <TouchableOpacity onPress={() => excluirDivida(d.id)}>
                    <Ionicons name="trash-outline" size={18} color="#62626e" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Barra de progresso */}
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, {
                  width: `${pct}%`,
                  backgroundColor: quitada ? '#00f59b' : pct > 70 ? '#00f59b' : pct > 30 ? '#ffb74d' : '#ff5252'
                }]} />
              </View>

              <View style={styles.dividaFooter}>
                <Text style={styles.dividaInfo}>Pago: R$ {d.pago.toFixed(2)}</Text>
                <Text style={styles.dividaInfo}>Restante: <Text style={{ color: quitada ? '#00f59b' : '#ff5252' }}>R$ {restante.toFixed(2)}</Text></Text>
              </View>

              {!quitada && (
                <View style={styles.dividaRodape}>
                  <Text style={styles.dividaHoras}>⏱ {horasD.toFixed(1)}h de esforço em aberto</Text>
                  <TouchableOpacity onPress={() => setModalPagar(d)} style={styles.btnPagar}>
                    <Text style={styles.btnPagarTxt}>Registrar Pagamento</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Modal: Nova Dívida */}
      <Modal visible={modalDivida} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nova Dívida</Text>
            <TextInput onChangeText={setNovaDividaNome} value={novaDividaNome} placeholder="Nome da dívida" placeholderTextColor="#62626e" style={styles.input} />
            <TextInput keyboardType="numeric" onChangeText={setNovaDividaTotal} value={novaDividaTotal} placeholder="Valor total (R$)" placeholderTextColor="#62626e" style={styles.input} />
            <TextInput keyboardType="numeric" onChangeText={setNovaDividaParcelas} value={novaDividaParcelas} placeholder="Número de parcelas (opcional)" placeholderTextColor="#62626e" style={styles.input} />
            <TouchableOpacity onPress={criarDivida} style={styles.btn}>
              <Text style={styles.btnTxt}>Adicionar Dívida</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalDivida(false)} style={styles.btnCancelar}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Registrar Pagamento */}
      <Modal visible={!!modalPagar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Registrar Pagamento</Text>
            <Text style={styles.modalSub}>{modalPagar?.nome}</Text>
            <TextInput keyboardType="numeric" onChangeText={setValorPagamento} value={valorPagamento} placeholder="Valor pago (R$)" placeholderTextColor="#62626e" style={styles.input} />
            <TouchableOpacity onPress={registrarPagamento} style={styles.btn}>
              <Text style={styles.btnTxt}>Confirmar Pagamento</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setModalPagar(null); setValorPagamento(''); }} style={styles.btnCancelar}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#fafffd', marginBottom: 20 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: '#fafffd', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 15, marginTop: 10 },
  sub: { color: '#62626e', marginBottom: 15 },

  card: { backgroundColor: '#09090b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  input: { backgroundColor: '#121216', color: '#fafffd', padding: 14, borderRadius: 8, marginBottom: 12 },
  btn: { backgroundColor: '#6d54ff', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#fff', fontWeight: '700' },

  focoContainer: { alignItems: 'center', marginBottom: 20, backgroundColor: '#09090b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imagemContainer: { width: 200, height: 200, borderRadius: 100, overflow: 'hidden', backgroundColor: '#121216', borderWidth: 2, borderColor: '#6d54ff', justifyContent: 'center', alignItems: 'center' },
  imagemDesejo: { width: '100%', height: '100%', position: 'absolute' },
  overlayText: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  porcentagem: { fontSize: 24, fontWeight: '900', color: '#fff' },
  nomeDesejo: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 20 },
  dadosGerais: { color: '#fafffd', fontSize: 16, fontWeight: '600', marginTop: 8 },
  dadosProgresso: { color: '#62626e', marginTop: 5, marginBottom: 20, fontSize: 12 },
  areaDeposito: { flexDirection: 'row', gap: 10, width: '100%' },
  inputDeposito: { flex: 1, backgroundColor: '#121216', color: '#fafffd', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnAcao: { flexDirection: 'row', gap: 8, backgroundColor: '#6d54ff', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  trofeusSection: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20, marginBottom: 20 },
  trofeusTitulo: { fontSize: 16, fontWeight: '700', color: '#fafffd' },
  trofeuCard: { width: 100, marginRight: 15, alignItems: 'center' },
  trofeuImg: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, borderWidth: 1, borderColor: '#00f59b' },
  trofeuNome: { color: '#62626e', fontSize: 11, textAlign: 'center' },

  // Dívidas
  dividasTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  btnNovaDivida: { backgroundColor: '#6d54ff', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  resumoDividas: { flexDirection: 'row', backgroundColor: 'rgba(255,82,82,0.08)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)' },
  resumoLabel: { fontSize: 11, color: '#62626e', textTransform: 'uppercase', marginBottom: 4 },
  resumoValor: { fontSize: 18, fontWeight: '800', color: '#fafffd' },

  dividaCard: { backgroundColor: '#09090b', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dividaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dividaNome: { fontSize: 15, fontWeight: '700', color: '#fafffd' },
  dividaSub: { fontSize: 11, color: '#62626e', marginTop: 2 },
  barraFundo: { height: 8, backgroundColor: '#1c1c21', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barraPreenchida: { height: '100%', borderRadius: 4 },
  dividaFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dividaInfo: { fontSize: 12, color: '#62626e' },
  dividaRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  dividaHoras: { fontSize: 11, color: '#62626e' },
  btnPagar: { backgroundColor: 'rgba(109,84,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(109,84,255,0.4)' },
  btnPagarTxt: { color: '#6d54ff', fontWeight: '600', fontSize: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#09090b', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  emptyTxt: { color: '#62626e', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#09090b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#fafffd', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#62626e', marginBottom: 16 },
  btnCancelar: { padding: 14, alignItems: 'center', marginTop: 8 },
  btnCancelarTxt: { color: '#62626e', fontWeight: '600' },
});