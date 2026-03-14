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
          <th>Clima ⛅</th> <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="consulta in consultas" :key="consulta.id">
          
          <template v-if="consultaEditando !== consulta.id">
            <td>{{ formatarData(consulta.dataConsulta) }}</td>
            <td><strong>{{ consulta.horaConsulta }}</strong></td>
            <td>{{ consulta.bairro }}</td>
            <td>{{ consulta.especialidade }}</td>
            
            <td>
              <div v-if="consulta.climaAtualizado" class="clima-info">
                <img v-if="consulta.iconeClima" :src="consulta.iconeClima" alt="Clima" class="icone-clima" />
                <span class="clima-texto">{{ consulta.clima }}</span>
              </div>
              <div v-else class="clima-carregando">⏳ Buscando...</div>
            </td>

            <td class="acoes">
              <button @click="iniciarEdicao(consulta)" class="btn-icone" title="Editar">✏️</button>
              <button @click="deletarAgendamento(consulta.id)" class="btn-icone deletar" title="Cancelar">🗑️</button>
            </td>
          </template>

          <template v-else>
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
            <td style="color: #888;">{{ consulta.bairro }}</td>
            <td>
              <select v-model="formEdicao.especialidade" class="input-tabela">
                <option value="Clínico Geral">Clínico Geral</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Dermatologia">Dermatologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Ortopedia">Ortopedia</option>
              </select>
            </td>
            
            <td style="color: #aaa; font-size: 12px; font-style: italic;">Atualiza ao salvar</td>
            
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

// ==========================================
// 🔍 1. BUSCAR AS CONSULTAS
// ==========================================
const buscarConsultas = async () => {
  carregando.value = true;
  erroApi.value = '';
  try {
    const resposta = await axios.get(`${baseUrl}/minhas-consultas/${props.emailPaciente}`);
    consultas.value = resposta.data;
    
    // Assim que baixar as consultas, manda buscar o clima para cada uma delas!
    buscarClimaParaTabela();
    
  } catch (error) {
    erroApi.value = "Erro ao buscar os agendamentos.";
  } finally {
    carregando.value = false;
  }
};

// ==========================================
// ⛅ 2. BUSCAR O CLIMA PARA CADA LINHA
// ==========================================
const buscarClimaParaTabela = async () => {
  // ATENÇÃO: Confirme se o nome da sua variável no .env é esse mesmo!
  const apiKey = import.meta.env.VITE_OPENWEATHER; 
  
  if (!apiKey) return; // Se não achar a chave, nem tenta buscar

  for (let i = 0; i < consultas.value.length; i++) {
    const consulta = consultas.value[i];
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${consulta.bairro},Rio de Janeiro,BR&appid=${apiKey}&units=metric&lang=pt_br`;
      const resposta = await axios.get(url);
      
      // Procura na lista da API a previsão que bata com a DATA da consulta
      const previsaoDoDia = resposta.data.list.find(item => item.dt_txt.startsWith(consulta.dataConsulta));

      if (previsaoDoDia) {
        // Se achou, monta o texto (ex: "Nublado (28°C)") e pega a imagem
        consulta.clima = `${previsaoDoDia.weather[0].description} (${Math.round(previsaoDoDia.main.temp)}°C)`;
        consulta.iconeClima = `https://openweathermap.org/img/wn/${previsaoDoDia.weather[0].icon}.png`;
      } else {
        // Se a data for mais de 5 dias no futuro, a API grátis não acha
        consulta.clima = 'Indisponível (> 5 dias)';
        consulta.iconeClima = null;
      }
    } catch (error) {
      consulta.clima = 'Erro na busca';
      consulta.iconeClima = null;
    }
    
    // Avisa o Vue que terminou de atualizar essa linha específica para ele desenhar na tela
    consulta.climaAtualizado = true; 
  }
};

// --- Lógica de Edição e Exclusão (Mantida igualzinha) ---
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
    buscarConsultas(); // Ao recarregar as consultas, ele busca o clima da nova data automaticamente!
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
/* Estilos anteriores mantidos */
.container-agendamentos {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  font-family: Arial, sans-serif;
  max-width: 900px; /* Aumentei um pouquinho para caber a nova coluna confortavelmente */
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
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.tabela-consultas th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: bold;
}

.tabela-consultas tr:hover {
  background-color: #fcfcfc;
}

/* --- Novos estilos do Clima --- */
.clima-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}

.icone-clima {
  width: 35px;
  height: 35px;
  background-color: #e3f2fd; /* Fundo azulzinho pra destacar o ícone */
  border-radius: 50%;
}

.clima-texto {
  text-transform: capitalize; /* Deixa a primeira letra maiúscula (ex: "chuva leve" -> "Chuva leve") */
  white-space: nowrap;
}

.clima-carregando {
  font-size: 12px;
  color: #888;
  font-style: italic;
}
/* ------------------------------- */

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