<template>
  <div class="container-agendamentos">
    
    <div class="cabecalho">
      <h2>Minhas Consultas 🩺</h2>
      <button @click="$emit('voltar')" class="btn-nova-consulta">➕ Nova Consulta</button>
    </div>

    <div v-if="carregando" class="mensagem-status">Buscando seus agendamentos...</div>
    <div v-else-if="erroApi" class="mensagem-erro">{{ erroApi }}</div>
    <div v-else-if="consultas.length === 0" class="mensagem-status">Você ainda não tem consultas agendadas.</div>

    <table v-else class="tabela-consultas">
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Unidade (Bairro)</th>
          <th>Especialidade</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="consulta in consultas" :key="consulta.id">
          
          <template v-if="consultaEditando !== consulta.id">
            <td>{{ formatarData(consulta.dataConsulta) }}</td>
            <td><strong>{{ consulta.horaConsulta }}</strong></td>
            <td>{{ consulta.bairro }}</td>
            <td>{{ consulta.especialidade }}</td>
            <td class="acoes">
              <button @click="iniciarEdicao(consulta)" class="btn-icone" title="Editar">✏️</button>
              <button @click="deletarAgendamento(consulta.id)" class="btn-icone deletar" title="Cancelar">🗑️</button>
            </td>
          </template>

          <template v-else>
            <td>
              <input type="date" v-model="formEdicao.dataConsulta" class="input-tabela" />
            </td>
            <td>
              <select v-model="formEdicao.horaConsulta" class="input-tabela">
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
              </select>
            </td>
            <td style="color: #888;">{{ consulta.bairro }}</td> <td>
              <select v-model="formEdicao.especialidade" class="input-tabela">
                <option value="Clínico Geral">Clínico Geral</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Dermatologia">Dermatologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Ortopedia">Ortopedia</option>
              </select>
            </td>
            <td class="acoes">
              <button @click="salvarEdicao(consulta.id)" class="btn-icone salvar" title="Salvar">💾</button>
              <button @click="consultaEditando = null" class="btn-icone" title="Cancelar Edição">❌</button>
            </td>
          </template>

        </tr>
      </tbody>
    </table>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const emit = defineEmits(['voltar']);

const props = defineProps({
  emailPaciente: String
});

const consultas = ref([]);
const carregando = ref(true);
const erroApi = ref('');

// URL do Backend
const baseUrl = 'https://sistema-atendimento-inteligente-clinica.onrender.com';

const buscarConsultas = async () => {
  carregando.value = true;
  erroApi.value = '';
  try {
    const resposta = await axios.get(`${baseUrl}/minhas-consultas/${props.emailPaciente}`);
    consultas.value = resposta.data;
  } catch (error) {
    erroApi.value = "Erro ao buscar os agendamentos.";
  } finally {
    carregando.value = false;
  }
};

// --- Lógica de Edição ---
const consultaEditando = ref(null);
const formEdicao = reactive({
  dataConsulta: '',
  horaConsulta: '',
  especialidade: ''
});

const iniciarEdicao = (consulta) => {
  consultaEditando.value = consulta.id;
  formEdicao.dataConsulta = consulta.dataConsulta;
  formEdicao.horaConsulta = consulta.horaConsulta;
  formEdicao.especialidade = consulta.especialidade || 'Clínico Geral';
};

const salvarEdicao = async (id) => {
  try {
    await axios.put(`${baseUrl}/agendamento/${id}`, formEdicao);
    alert('✅ Agendamento atualizado com sucesso!');
    consultaEditando.value = null; 
    buscarConsultas(); 
  } catch (error) {
    alert(error.response?.data?.erro || 'Erro ao atualizar.');
  }
};

const deletarAgendamento = async (id) => {
  if (confirm("⚠️ Tem certeza que deseja cancelar esta consulta?")) {
    try {
      await axios.delete(`${baseUrl}/agendamento/${id}`);
      alert('🗑️ Consulta cancelada.');
      buscarConsultas(); 
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  }
};

const formatarData = (dataSql) => {
  if (!dataSql) return '';
  return dataSql.split('-').reverse().join('/');
};

onMounted(() => {
  buscarConsultas();
});
</script>

<style scoped>
.container-agendamentos {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 40px auto;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

h2 {
  color: #333;
  margin: 0;
}

.btn-nova-consulta {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.btn-nova-consulta:hover { background: #0056b3; }

.tabela-consultas {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.tabela-consultas th, .tabela-consultas td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.tabela-consultas th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: bold;
}

.tabela-consultas tr:hover {
  background-color: #fcfcfc;
}

.acoes {
  display: flex;
  gap: 10px;
}

.btn-icone {
  background: #f1f1f1;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: 0.2s;
}

.btn-icone:hover { background: #e2e2e2; }
.btn-icone.deletar:hover { background: #ffcdd2; }
.btn-icone.salvar:hover { background: #c8e6c9; }

.input-tabela {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
}

.mensagem-status, .mensagem-erro {
  text-align: center;
  padding: 20px;
  color: #666;
}
.mensagem-erro { color: #dc3545; }
</style>