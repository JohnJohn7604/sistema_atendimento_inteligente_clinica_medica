<template>
  <div class="container-secretaria">
    
    <div class="cabecalho">
      <h2>Painel da Secretária 👩‍💼</h2>
      <button @click="$emit('sair')" class="btn-sair">Sair do Sistema</button>
    </div>

    <div v-if="carregando" class="mensagem-status">Carregando agenda da clínica...</div>
    <div v-else-if="erroApi" class="mensagem-erro">{{ erroApi }}</div>
    <div v-else-if="todasConsultas.length === 0" class="mensagem-status">Nenhuma consulta agendada na clínica.</div>

    <table v-else class="tabela-consultas">
      <thead>
        <tr>
          <th>Paciente</th> <th>Data</th>
          <th>Horário</th>
          <th>Especialidade</th>
          <th>Unidade</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="consulta in todasConsultas" :key="consulta.id">
          
          <td>
            <strong>{{ consulta.nome }}</strong><br>
            <small style="color: #666;">{{ consulta.email }}</small>
          </td>
          <td>{{ formatarData(consulta.dataConsulta) }}</td>
          <td><strong>{{ consulta.horaConsulta }}</strong></td>
          <td class="destaque-especialidade">{{ consulta.especialidade || 'Clínico Geral' }}</td>
          <td>{{ consulta.bairro }}</td>
          
          <td class="acoes">
            <button @click="deletarAgendamento(consulta.id, consulta.nome)" class="btn-icone deletar" title="Cancelar Consulta">🗑️ Cancelar</button>
          </td>

        </tr>
      </tbody>
    </table>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const emit = defineEmits(['sair']);

const todasConsultas = ref([]);
const carregando = ref(true);
const erroApi = ref('');

const baseUrl = 'https://sistema-atendimento-inteligente-clinica.onrender.com';

// Busca a agenda de TODOS
const buscarTodasConsultas = async () => {
  carregando.value = true;
  erroApi.value = '';
  try {
    const resposta = await axios.get(`${baseUrl}/consultas`);
    todasConsultas.value = resposta.data;
  } catch (error) {
    erroApi.value = "Erro ao carregar a agenda geral da clínica.";
  } finally {
    carregando.value = false;
  }
};

// Secretária cancelando consulta
const deletarAgendamento = async (id, nomePaciente) => {
  if (confirm(`⚠️ Tem certeza que deseja cancelar a consulta do(a) paciente ${nomePaciente}?`)) {
    try {
      await axios.delete(`${baseUrl}/agendamento/${id}`);
      alert('Consulta cancelada com sucesso!');
      buscarTodasConsultas(); // Recarrega a tabela
    } catch (error) {
      alert('Erro ao cancelar a consulta.');
    }
  }
};

const formatarData = (dataSql) => {
  if (!dataSql) return '';
  return dataSql.split('-').reverse().join('/');
};

onMounted(() => {
  buscarTodasConsultas();
});
</script>

<style scoped>
.container-secretaria {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  font-family: Arial, sans-serif;
  max-width: 1000px; /* Mais largo para caber todas as infos */
  margin: 40px auto;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #eee;
  padding-bottom: 15px;
}

h2 {
  color: #2c3e50;
  margin: 0;
}

.btn-sair {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.btn-sair:hover { background: #c82333; }

.tabela-consultas {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.tabela-consultas th, .tabela-consultas td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.tabela-consultas th {
  background-color: #e9ecef; /* Um cinza um pouco diferente do painel do paciente */
  color: #333;
  font-weight: bold;
}

.tabela-consultas tr:hover {
  background-color: #f8f9fa;
}

.destaque-especialidade {
  color: #17a2b8;
  font-weight: bold;
}

.btn-icone {
  background: #f1f1f1;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: 0.2s;
  color: #333;
}

.btn-icone.deletar:hover { 
  background: #ffcdd2; 
  color: #d32f2f;
}

.mensagem-status, .mensagem-erro {
  text-align: center;
  padding: 20px;
  color: #666;
}
.mensagem-erro { color: #dc3545; }
</style>