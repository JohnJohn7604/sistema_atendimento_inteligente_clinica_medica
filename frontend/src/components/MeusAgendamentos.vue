<template>
  <div class="container">
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

const emit = defineEmits(['voltarAgendamento']);
const props = defineProps({ emailPaciente: String });

const minhasConsultas = ref([]);
const carregando = ref(true);

const buscarMinhasConsultas = async () => {
  try {
    const resposta = await axios.get(`http://localhost:3000/minhas-consultas/${props.emailPaciente}`);
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