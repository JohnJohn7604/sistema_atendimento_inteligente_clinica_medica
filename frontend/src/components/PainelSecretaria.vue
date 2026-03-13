<template>
  <div class="painel-container">
    <h2>Painel da Secretária 👩‍💻</h2>

    <div v-if="!logado" class="login-box">
      <p>Acesso restrito. Insira suas credenciais.</p>
      
      <div class="campo">
        <input v-model="usuario" type="text" placeholder="Usuário (ex: admin)" />
      </div>
      <div class="campo">
        <input v-model="senha" type="password" placeholder="Senha (ex: 1234)" />
      </div>
      
      <button @click="fazerLogin" class="btn-login">Entrar no Sistema</button>
      <div v-if="erroLogin" class="erro-texto" style="margin-top: 10px;">{{ erroLogin }}</div>
    </div>

    <div v-else>
      <p>Gerenciamento de Agendamentos Médicos</p>

      <div v-if="carregando" class="mensagem">Carregando consultas...</div>
      <div v-else-if="erro" class="erro-texto">{{ erro }}</div>
      
      <table v-else-if="consultas.length > 0" class="tabela-consultas">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>E-mail</th>
            <th>Data da Consulta</th>
            <th>Bairro / Cidade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(consulta, index) in consultas" :key="index">
            <td><strong>{{ consulta.nome }}</strong></td>
            <td>{{ consulta.email }}</td>
            <td>{{ formatarData(consulta.dataConsulta) }}</td>
            <td>{{ consulta.bairro }} - {{ consulta.cidade }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="mensagem">Nenhum paciente agendado ainda.</div>
      
      <button @click="buscarConsultas" class="btn-atualizar">🔄 Atualizar Lista</button>
      <button @click="sair" class="btn-sair">Sair</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

// Variáveis de controle de Login
const logado = ref(false);
const token = ref('');
const usuario = ref('');
const senha = ref('');
const erroLogin = ref('');

// Variáveis da Tabela
const consultas = ref([]);
const carregando = ref(false);
const erro = ref('');

// Função para fazer o Login e pegar o Token
const fazerLogin = async () => {
  erroLogin.value = '';
  try {
    const resposta = await axios.post('https://sistema-atendimento-inteligente-clinica.onrender.com/login', {
      usuario: usuario.value,
      senha: senha.value
    });

    // Se deu certo, guardamos o crachá e mudamos a tela!
    token.value = resposta.data.token;
    logado.value = true;
    
    // Agora que temos o crachá, podemos buscar a lista
    buscarConsultas();
  } catch (err) {
    erroLogin.value = 'Usuário ou senha incorretos!';
  }
};

// Busca os dados no servidor EXIBINDO O CRACHÁ (Token)
const buscarConsultas = async () => {
  carregando.value = true;
  erro.value = '';
  
  try {
    const resposta = await axios.get('https://sistema-atendimento-inteligente-clinica.onrender.com/consultas', {
      // É aqui que mostramos o crachá para o porteiro do Back-end!
      headers: { Authorization: `Bearer ${token.value}` }
    });
    consultas.value = resposta.data;
  } catch (err) {
    erro.value = 'Sessão expirada ou acesso negado.';
    logado.value = false; // Força o login novamente
  } finally {
    carregando.value = false;
  }
};

const sair = () => {
  logado.value = false;
  token.value = '';
  usuario.value = '';
  senha.value = '';
};

const formatarData = (dataOriginal) => {
  if (!dataOriginal) return '-';
  const [ano, mes, dia] = dataOriginal.split('-');
  return `${dia}/${mes}/${ano}`;
};
</script>

<style scoped>
/* O mesmo CSS de antes, com alguns pequenos ajustes para os botões novos */
.painel-container {
  max-width: 800px;
  width: 90%;
  margin: 40px auto;
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  font-family: Arial, sans-serif;
  text-align: center;
}

.login-box {
  max-width: 300px;
  margin: 0 auto;
}

.campo input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

h2 { color: #333; margin-bottom: 5px; }
p { color: #666; margin-bottom: 25px; }

.tabela-consultas { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.tabela-consultas th, .tabela-consultas td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.tabela-consultas th { background-color: #f8f9fa; color: #333; }

.btn-login, .btn-atualizar, .btn-sair {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  margin: 5px;
}

.btn-login { background: #28a745; width: 100%; }
.btn-login:hover { background: #218838; }
.btn-atualizar { background: #007bff; }
.btn-atualizar:hover { background: #0056b3; }
.btn-sair { background: #dc3545; }
.btn-sair:hover { background: #c82333; }

.mensagem { padding: 20px; color: #555; }
.erro-texto { color: #d9534f; font-weight: bold; }
</style>