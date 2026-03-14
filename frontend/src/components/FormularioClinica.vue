<template>
  <div class="container">
    <h2>Agendamento Médico 🩺</h2>

    <Teleport to="body">
      <div v-if="mensagemSucesso" class="mensagem-sucesso-toast">
        ✅ {{ mensagemSucesso }}
      </div>
    </Teleport>
    <div v-if="erroApi" class="mensagem-erro">{{ erroApi }}</div>

    <form @submit.prevent="enviarAgendamento">
      <div class="campo">
        <label>Nome do Paciente:</label>
        <input v-model="form.nome" type="text" disabled /> 
      </div>

      <div class="campo">
        <label>CEP: (Sem traços)</label>
        <input v-model="form.cep" @blur="buscarCep" type="text" placeholder="Digite apenas números" required maxlength="8" />
        <span v-if="buscandoCep" class="loading-texto">Buscando CEP...</span>
      </div>

      <div class="campo">
        <label>Especialidade Médica:</label>
        <select v-model="form.especialidade" required>
          <option value="" disabled>Selecione a especialidade</option>
          <option value="Clínico Geral">🩺 Clínico Geral</option>
          <option value="Cardiologia">❤️ Cardiologia</option>
          <option value="Dermatologia">🧴 Dermatologia</option>
          <option value="Pediatria">👶 Pediatria</option>
          <option value="Ortopedia">🦴 Ortopedia</option>
          <option value="Ginecologista">🚺 Ginecologista</option>
          <option value="Urologista ">🚹 Urologista</option>
        </select>
      </div>

      <div class="campo" v-if="form.logradouro">
        <label>Endereço Completo:</label>
        <input v-model="form.logradouro" type="text" disabled />
        <input v-model="form.bairro" type="text" disabled style="margin-top: 5px;" />
        <input v-model="form.cidade" type="text" disabled style="margin-top: 5px;" />
      </div>

      <div v-if="erroApi" class="erro-texto">{{ erroApi }}</div>

  <div class="campo" v-if="form.cidade">
        <label>Data da Consulta:</label>
        <input 
          v-model="form.dataConsulta" 
          type="date" 
          @change="verificarClima"
        />

        <div style="text-align: right; margin-bottom: 15px;">
      
    </div>

    <div class="campo" v-if="form.dataConsulta">
      <label>Horário da Consulta:</label>
      <select v-model="form.horaConsulta" required>
        <option value="" disabled>Selecione um horário</option>
        <option value="08:00">08:00</option>
        <option value="09:00">09:00</option>
        <option value="10:00">10:00</option>
        <option value="14:00">14:00</option>
        <option value="15:00">15:00</option>
      </select>
    </div>
        
        <div v-if="previsaoTempo" style="margin-top: 10px; padding: 10px; background-color: #e0f7fa; border-radius: 5px; color: #006064;">
          🌤️ <strong>Previsão para {{ form.cidade }}:</strong> {{ previsaoTempo }}
        </div>
      </div>
      
      <button type="submit" :disabled="carregando || form.nome.length < 3 || /[0-9]/.test(form.nome)">
        {{ carregando ? 'Processando...' : 'Avançar Agendamento' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted} from 'vue';
import axios from 'axios';

const emit = defineEmits(['agendamentoCriado']);

const props = defineProps({
  nomePaciente: String,
  emailPaciente: String
});

// dataConsulta é adicionado aqui
const form = reactive({
  nome: props.nomePaciente || '',
  email: props.emailPaciente || '',
  especialidade: ' ', 
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  dataConsulta: '',
  horaConsulta: '' 
});

// Variável para controlar se o botão aparece ou não
const temAgendamentos = ref(false);


// Variável para guardar o texto do clima
const previsaoTempo = ref('');

const verificarClima = async () => {
  if (!form.cidade || !form.dataConsulta) return;

  const apiKey = import.meta.env.VITE_OPENWEATHER; 
  const localBusca = `${form.bairro},${form.cidade}`;
  
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(localBusca)}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const resposta = await axios.get(url);
    const previsoes = resposta.data.list;
    const dataEscolhida = form.dataConsulta; 

    const previsaoDoDia = previsoes.find(p => p.dt_txt.includes(`${dataEscolhida} 12:00:00`)) 
                       || previsoes.find(p => p.dt_txt.startsWith(dataEscolhida));

    if (previsaoDoDia) {
      const descricao = previsaoDoDia.weather[0].description;
      const temperatura = Math.round(previsaoDoDia.main.temp);
      
      // Formata a data de YYYY-MM-DD para DD/MM/AAAA
      const dataFormatada = dataEscolhida.split('-').reverse().join('/');
      
      // Mensagem atualizada com a DATA
      previsaoTempo.value = `Previsão para o dia ${dataFormatada} em ${form.bairro}: ${descricao} com ${temperatura}ºC.`;
      
      if (descricao.includes('chuva')) {
        previsaoTempo.value += " ☔ Lembre-se do guarda-chuva!";
      }
    } else {
      previsaoTempo.value = "⚠️ Previsão detalhada disponível apenas para os próximos 5 dias.";
    }
  } catch (error) {
    // ...
  }
};

const erroApi = ref('');
const mensagemSucesso = ref('');
const carregando = ref(false);
const buscandoCep = ref(false);

// A função que vai no ViaCEP buscar a rua
const buscarCep = async () => {
  // Limpa o CEP, deixa só os números
  const cepLimpo = form.cep.replace(/\D/g, '');
  
  if (cepLimpo.length === 8) {
    buscandoCep.value = true;
    try {
      const resposta = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (!resposta.data.erro) {
        form.logradouro = resposta.data.logradouro;
        form.bairro = resposta.data.bairro;
        form.cidade = resposta.data.localidade; // O ViaCEP chama cidade de 'localidade'
      } else {
        alert("CEP não encontrado. Verifique se digitou corretamente.");
        form.logradouro = '';
      }
    } catch (error) {
      console.error("Erro na busca do CEP:", error);
    } finally {
      buscandoCep.value = false;
    }
  }
};

const enviarAgendamento = async () => {
  if (/[0-9]/.test(form.nome)) return;
  
  carregando.value = true;
  erroApi.value = '';
  mensagemSucesso.value = '';

  try {
    const resposta = await axios.post('https://sistema-atendimento-inteligente-clinica.onrender.com/agendamento', form);
    
    // 1. Define a mensagem que veio do backend
    mensagemSucesso.value = resposta.data.mensagem;
    
    // 2. Faz a notificação sumir após 4 segundos (4000 milissegundos)
    setTimeout(() => {
      mensagemSucesso.value = '';
    }, 4000);
    
    // Limpa o formulário...
    form.cep = '';
    form.logradouro = '';
    form.bairro = '';
    form.cidade = '';
    form.dataConsulta = '';
    form.horaConsulta = '';
    form.especialidade = ''; // Não esqueça de limpar a especialidade também!
    previsaoTempo.value = '';

    emit('agendamentoCriado'); 
    
  } catch (error) {
    erroApi.value = error.response?.data?.erro || "Erro ao conectar com o servidor da clínica.";
  } finally {
    carregando.value = false;
  }
};
</script>

<style scoped>
.container { 
  max-width: 500px; 
  width: 90%; 
  background-color: white;
  padding: 30px; 
  border-radius: 12px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
  font-family: Arial, sans-serif; 
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
  line-height: 1.4; 
}
.campo { 
  margin-bottom: 15px; 
  display: flex; 
  flex-direction: column; }

input, select { 
  padding: 10px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
  margin-top: 5px; }

.erro-borda { 
  border: 2px solid #dc3545; 
  outline: none; }

.erro-texto { 
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px; }

.erro-texto-api {  
  color: #dc3545;
  text-align: center;
  font-weight: bold; }

.sucesso { 
  background: #d4edda; 
  color: #155724; 
  padding: 15px; 
  border-radius: 4px; 
  margin-bottom: 20px; 
  text-align: center; 
  font-weight: bold;
}
button { 
  padding: 12px 30px; 
  background: #9abf74; 
  color: white; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 16px; 
  font-weight: bold; 
  display: block; 
  margin: 25px auto 0; 
  transition: background 0.3s;
}

button:hover {
  background: #88aa65; /* efeito ao passar o mouse */
}
button:disabled { 
  background: #a0c472; 
  cursor: not-allowed; }

.btn-secundario {
  background: #6c757d;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer; }

select:focus {
  border-color: #9abf74;
  outline: none;
  box-shadow: 0 0 5px rgba(154, 191, 116, 0.5);
}

.mensagem-sucesso { 
  position: fixed;
  top: 0px; /* 
  right: 0px; /* Mantém colado no lado direito */
  background-color: #28a745; /* Verde sucesso */
  color: white; 
  padding: 15px 25px; 
  border-radius: 8px; 
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); 
  font-weight: bold;
  z-index: 9999; /* Garante que fique por cima de qualquer outro elemento da tela */
  animation: deslizar 0.5s ease-out;
}

.mensagem-sucesso-toast { 
  position: fixed;
  top: 70px; /* Distância perfeita abaixo da barra preta */
  right: 20px; /* Alinhado à direita */
  background-color: #28a745; 
  color: white; 
  padding: 15px 25px; 
  border-radius: 8px; 
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); 
  font-weight: bold;
  z-index: 99999; /* Fica acima de TUDO na tela */
  animation: deslizar 0.5s ease-out;
}

@keyframes deslizar {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Animação suave de entrada */
@keyframes deslizar {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Animação para a notificação entrar deslizando pela direita */
@keyframes deslizar {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>