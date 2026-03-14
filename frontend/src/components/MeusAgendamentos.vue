<template>
  <div class="container">

    <div v-for="consulta in minhasConsultas" :key="consulta.id" class="card-consulta">
  
      <div v-if="consultaEditando !== consulta.id">
        <p><strong>Especialidade:</strong> {{ consulta.especialidade }}</p> <p><strong>Data:</strong> {{ consulta.dataConsulta }}</p>
        <p><strong>Hora:</strong> {{ consulta.horaConsulta }}</p>
        
        <div class="botoes-acao">
          <button @click="iniciarEdicao(consulta)" class="btn-editar">✏️ Editar</button>
          <button @click="deletarAgendamento(consulta.id)" class="btn-deletar">🗑️ Cancelar</button>
        </div>
      </div>

      <div v-else>
        <label>Nova Especialidade:</label>
        <select v-model="formEdicao.especialidade">
          <option value="Clínico Geral">Clínico Geral</option>
          <option value="Cardiologia">Cardiologia</option>
          <option value="Dermatologia">Dermatologia</option>
          <option value="Pediatria">Pediatria</option>
          <option value="Ortopedia">Ortopedia</option>
        </select>

        <label>Nova Data:</label>
        <input type="date" v-model="formEdicao.dataConsulta" />

        <label>Nova Hora:</label>
        <select v-model="formEdicao.horaConsulta">
          <option value="08:00">08:00</option>
          <option value="09:00">09:00</option>
          <option value="10:00">10:00</option>
          <option value="14:00">14:00</option>
          <option value="15:00">15:00</option>
        </select>

        <div class="botoes-acao">
          <button @click="salvarEdicao(consulta.id)" class="btn-salvar">💾 Salvar</button>
          <button @click="consultaEditando = null" class="btn-cancelar">❌ Cancelar</button>
        </div>
      </div>

    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>Minhas Consultas 🩺</h2>
      <button @click="$emit('voltarAgendamento')" class="btn-secundario">➕ Nova Consulta</button>
    </div>

    <div v-if="carregando">Buscando seus agendamentos...</div>
    
    <table v-else-if="minhasConsultas.length > 0" class="tabela-consultas">
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Unidade (Bairro)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(consulta, index) in minhasConsultas" :key="index">
          <td>{{ formatarData(consulta.dataConsulta) }}</td>
          <td><strong>{{ consulta.horaConsulta }}</strong></td>
          <td>{{ consulta.bairro }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="mensagem">Você ainda não tem consultas agendadas.</div>
  </div>

</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const baseUrl = 'https://sistema-atendimento-inteligente-clinica.onrender.com';

// Controle de Edição
const consultaEditando = ref(null);
const formEdicao = reactive({
  dataConsulta: '',
  horaConsulta: '',
  especialidade: ''
});

// Função para abrir os campos de edição
const iniciarEdicao = (consulta) => {
  consultaEditando.value = consulta.id;
  formEdicao.dataConsulta = consulta.dataConsulta;
  formEdicao.horaConsulta = consulta.horaConsulta;
  formEdicao.especialidade = consulta.especialidade;
};

// Função para Salvar a edição (PUT)
const salvarEdicao = async (id) => {
  try {
    await axios.put(`${baseUrl}/agendamento/${id}`, formEdicao);
    alert('Agendamento atualizado!');
    consultaEditando.value = null; // Fecha o modo de edição
    // Aqui você deve chamar a função que recarrega a lista de consultas!
  } catch (error) {
    alert(error.response?.data?.erro || 'Erro ao atualizar');
  }
};

// Função para Deletar (DELETE)
const deletarAgendamento = async (id) => {
  const confirmacao = confirm("Tem certeza que deseja cancelar esta consulta?");
  if (confirmacao) {
    try {
      await axios.delete(`${baseUrl}/agendamento/${id}`);
      alert('Consulta cancelada!');
      // Aqui você deve chamar a função que recarrega a lista de consultas!
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  }
};

const emit = defineEmits(['voltarAgendamento']);
const props = defineProps({ emailPaciente: String });

const minhasConsultas = ref([]);
const carregando = ref(true);

const buscarMinhasConsultas = async () => {
  try {
    const resposta = await axios.get(`https://sistema-atendimento-inteligente-clinica.onrender.com/minhas-consultas/${props.emailPaciente}`);
    minhasConsultas.value = resposta.data;
  } catch (error) {
    console.error("Erro ao carregar consultas");
  } finally {
    carregando.value = false;
  }
};

const formatarData = (dataOriginal) => {
  if (!dataOriginal) return '-';
  const [ano, mes, dia] = dataOriginal.split('-');
  return `${dia}/${mes}/${ano}`;
};

onMounted(() => {
  buscarMinhasConsultas();
});
</script>

<style scoped>
.container { background: white; padding: 30px; border-radius: 12px; margin: 20px auto; max-width: 600px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.tabela-consultas { width: 100%; border-collapse: collapse; margin-top: 20px; }
.tabela-consultas th, .tabela-consultas td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.btn-secundario { background: #007bff; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; }
.mensagem { padding: 20px 0; color: #666; text-align: center; }
</style>