<template>
  <div class="container-secretaria">
    
    <div class="cabecalho">
      <h2>Painel da Secretária 👩‍💼</h2>
      <div class="botoes-cabecalho">
        <button @click="abrirModalNovaConsulta" class="btn-nova">➕ Agendar Paciente</button>
        <button @click="$emit('sair')" class="btn-sair">Sair do Sistema</button>
      </div>
    </div>

    <div v-if="carregando" class="mensagem-status">Carregando agenda da clínica...</div>
    <div v-else-if="erroApi" class="mensagem-erro">{{ erroApi }}</div>
    <div v-else-if="todasConsultas.length === 0" class="mensagem-status">Nenhuma consulta agendada na clínica.</div>

    <table v-else class="tabela-consultas">
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Data</th>
          <th>Horário</th>
          <th>Especialidade</th>
          <th>Unidade</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="consulta in todasConsultas" :key="consulta.id">
          
          <template v-if="consultaEditando !== consulta.id">
            <td>
              <strong>{{ consulta.nome }}</strong><br>
              <small style="color: #666;">{{ consulta.email }}</small>
            </td>
            <td>{{ formatarData(consulta.dataConsulta) }}</td>
            <td><strong>{{ consulta.horaConsulta }}</strong></td>
            <td class="destaque-especialidade">{{ consulta.especialidade || 'Clínico Geral' }}</td>
            <td>{{ consulta.bairro }}</td>
            
            <td class="acoes">
              <button @click="iniciarEdicao(consulta)" class="btn-icone" title="Editar">✏️</button>
              <button @click="deletarAgendamento(consulta.id, consulta.nome)" class="btn-icone deletar" title="Cancelar Consulta">🗑️</button>
            </td>
          </template>

          <template v-else>
            <td>
              <strong>{{ consulta.nome }}</strong><br>
              <small style="color: #666;">{{ consulta.email }}</small>
            </td>
            <td><input type="date" v-model="formEdicao.dataConsulta" class="input-tabela" /></td>
            <td>
              <select v-model="formEdicao.horaConsulta" class="input-tabela">
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
              </select>
            </td>
            <td>
              <select v-model="formEdicao.especialidade" class="input-tabela">
                <option value="Clínico Geral">Clínico Geral</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Dermatologia">Dermatologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Ortopedia">Ortopedia</option>
                <option value="Ginecologia">Ginecologia</option>
                <option value="Oftalmologia">Urologista</option>
              </select>
            </td>
            <td style="color: #aaa; font-size: 12px; font-style: italic;">Mantém a mesma</td>
            <td class="acoes">
              <button @click="salvarEdicao(consulta.id)" class="btn-icone salvar" title="Salvar">💾</button>
              <button @click="consultaEditando = null" class="btn-icone" title="Cancelar Edição">❌</button>
            </td>
          </template>

        </tr>
      </tbody>
    </table>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-conteudo">
        <h3>Agendar Nova Consulta</h3>
        <p class="modal-sub">Selecione um paciente cadastrado no sistema:</p>

        <form @submit.prevent="salvarNovaConsulta" class="form-modal">
          
          <select v-model="pacienteSelecionado" @change="preencherDadosPaciente" required class="select-paciente">
            <option value="" disabled>Selecione um Paciente...</option>
            <option v-for="paciente in listaPacientes" :key="paciente.email" :value="paciente">
              {{ paciente.nome }} ({{ paciente.email }})
            </option>
          </select>
          
          <div class="linha-dupla">
            <input type="text" v-model="novaConsulta.cep" @blur="buscarCep" placeholder="CEP (Apenas números)" required />
            <input type="text" v-model="novaConsulta.bairro" placeholder="Bairro (Automático)" readonly class="input-bloqueado" />
          </div>

          <div class="linha-tripla">
            <select v-model="novaConsulta.especialidade" required>
              <option value="" disabled>Especialidade...</option>
              <option value="Clínico Geral">Clínico Geral</option>
              <option value="Cardiologia">Cardiologia</option>
              <option value="Dermatologia">Dermatologia</option>
              <option value="Pediatria">Pediatria</option>
              <option value="Ortopedia">Ortopedia</option>
              <option value="Ginecologia">Ginecologia</option>
              <option value="Urologista">Urologista</option>
            </select>
            <input type="date" v-model="novaConsulta.dataConsulta" required />
            <select v-model="novaConsulta.horaConsulta" required>
              <option value="" disabled>Hora...</option>
              <option value="08:00">08:00</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
            </select>
          </div>

          <div class="modal-botoes">
            <button type="button" @click="mostrarModal = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar">Confirmar Agendamento</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const emit = defineEmits(['sair']);

const todasConsultas = ref([]);
const carregando = ref(true);
const erroApi = ref('');

//link do render
const baseUrl = 'https://sistema-atendimento-inteligente-clinica.onrender.com'; 

const buscarTodasConsultas = async () => {
  carregando.value = true;
  erroApi.value = '';
  try {
    const resposta = await axios.get(`${baseUrl}/consultas`);
    todasConsultas.value = resposta.data;
  } catch (error) {
    erroApi.value = "Erro ao carregar a agenda geral.";
  } finally {
    carregando.value = false;
  }
};

// ==========================================
// LÓGICA DE EDIÇÃO E EXCLUSÃO
// ==========================================
const consultaEditando = ref(null);
const formEdicao = reactive({ dataConsulta: '', horaConsulta: '', especialidade: '' });

const iniciarEdicao = (consulta) => {
  consultaEditando.value = consulta.id;
  formEdicao.dataConsulta = consulta.dataConsulta;
  formEdicao.horaConsulta = consulta.horaConsulta;
  formEdicao.especialidade = consulta.especialidade || 'Clínico Geral';
};

const salvarEdicao = async (id) => {
  try {
    await axios.put(`${baseUrl}/agendamento/${id}`, formEdicao);
    alert('✅ Agendamento atualizado!');
    consultaEditando.value = null; 
    buscarTodasConsultas(); 
  } catch (error) {
    alert(error.response?.data?.erro || 'Erro ao atualizar.');
  }
};

const deletarAgendamento = async (id, nomePaciente) => {
  if (confirm(`⚠️ Cancelar a consulta de ${nomePaciente}?`)) {
    try {
      await axios.delete(`${baseUrl}/agendamento/${id}`);
      buscarTodasConsultas(); 
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  }
};

// ==========================================
// LÓGICA DO MODAL (NOVO AGENDAMENTO)
// ==========================================
const mostrarModal = ref(false);
const listaPacientes = ref([]);
const pacienteSelecionado = ref('');

const novaConsulta = reactive({
  nome: '', email: '', especialidade: '', cep: '', logradouro: '', bairro: '', cidade: '', dataConsulta: '', horaConsulta: ''
});

const abrirModalNovaConsulta = async () => {
  mostrarModal.value = true;
  pacienteSelecionado.value = '';
  Object.keys(novaConsulta).forEach(key => novaConsulta[key] = ''); // Limpa o formulário
  
  // Busca a lista de pacientes do banco assim que a secretária abre o modal
  try {
    const resposta = await axios.get(`${baseUrl}/pacientes`);
    listaPacientes.value = resposta.data;
  } catch (error) {
    console.error("Erro ao buscar pacientes");
  }
};

const preencherDadosPaciente = () => {
  // Quando a secretária escolhe na lista, o sistema preenche o nome e e-mail invisivelmente no formulário
  if (pacienteSelecionado.value) {
    novaConsulta.nome = pacienteSelecionado.value.nome;
    novaConsulta.email = pacienteSelecionado.value.email;
  }
};

const buscarCep = async () => {
  const cepLimpo = novaConsulta.cep.replace(/\D/g, '');
  if (cepLimpo.length === 8) {
    try {
      const resposta = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resposta.data.erro) {
        novaConsulta.logradouro = resposta.data.logradouro;
        novaConsulta.bairro = resposta.data.bairro;
        novaConsulta.cidade = resposta.data.localidade;
      }
    } catch (error) {
      console.log('Erro ao buscar CEP');
    }
  }
};

const salvarNovaConsulta = async () => {
  if (!novaConsulta.nome || !novaConsulta.email) {
    return alert("Por favor, selecione um paciente na lista!");
  }
  
  try {
    await axios.post(`${baseUrl}/agendamento`, novaConsulta);
    alert('🎉 Consulta agendada pela secretária!');
    mostrarModal.value = false; 
    buscarTodasConsultas(); 
  } catch (error) {
    alert(error.response?.data?.erro || 'Erro ao agendar consulta.');
  }
};

const formatarData = (dataSql) => dataSql ? dataSql.split('-').reverse().join('/') : '';

onMounted(() => buscarTodasConsultas());
</script>

<style scoped>
.container-secretaria { background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 1000px; margin: 40px auto; }
.cabecalho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
h2 { color: #2c3e50; margin: 0; }
.botoes-cabecalho { display: flex; gap: 15px; }
.btn-nova { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-nova:hover { background: #218838; }
.btn-sair { background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-sair:hover { background: #c82333; }
.tabela-consultas { width: 100%; border-collapse: collapse; margin-top: 10px; }
.tabela-consultas th, .tabela-consultas td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #eee; vertical-align: middle; }
.tabela-consultas th { background-color: #e9ecef; font-weight: bold; }
.tabela-consultas tr:hover { background-color: #f8f9fa; }
.destaque-especialidade { color: #17a2b8; font-weight: bold; }
.acoes { display: flex; gap: 10px; }
.btn-icone { background: #f1f1f1; border: none; border-radius: 4px; padding: 6px 10px; cursor: pointer; font-size: 14px; color: #333; }
.btn-icone:hover { background: #e2e2e2; }
.btn-icone.deletar:hover { background: #ffcdd2; color: #d32f2f; }
.btn-icone.salvar:hover { background: #c8e6c9; }
.input-tabela { padding: 5px; border: 1px solid #ccc; border-radius: 4px; width: 100%; }
.mensagem-status, .mensagem-erro { text-align: center; padding: 20px; color: #666; }
.mensagem-erro { color: #dc3545; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-conteudo { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.modal-conteudo h3 { margin: 0 0 5px 0; color: #333; }
.modal-sub { margin: 0 0 20px 0; color: #777; font-size: 14px; }
.form-modal input, .form-modal select { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
.select-paciente { background-color: #f1f8ff; border-color: #007bff; font-weight: bold; color: #0056b3; }
.input-bloqueado { background-color: #eee; color: #888; cursor: not-allowed; }
.linha-dupla, .linha-tripla { display: flex; gap: 10px; }
.modal-botoes { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
.btn-cancelar { background: white; border: 1px solid #ccc; padding: 10px 15px; border-radius: 6px; cursor: pointer; }
.btn-confirmar { background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-confirmar:hover { background: #0056b3; }
</style>