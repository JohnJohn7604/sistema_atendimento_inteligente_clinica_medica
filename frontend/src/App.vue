<template>
  <div>
    <div v-if="telaAtual === 'login'" class="auth-container">
      <div class="auth-box">
        <h2>Clínica Médica 🩺</h2>
        
        <div class="abas">
          <button :class="{ ativo: modoAuth === 'login' }" @click="modoAuth = 'login'">Entrar</button>
          <button :class="{ ativo: modoAuth === 'cadastro' }" @click="modoAuth = 'cadastro'">Criar Conta</button>
          <button @click="telaAtual = 'login-secretaria'" class="btn-acesso-restrito">Acesso da Secretária 👩‍💼</button>
        </div>

        <div v-if="mensagem" :class="{'sucesso-texto': sucesso, 'erro-texto': !sucesso}">
          {{ mensagem }}
        </div>

        <form v-if="modoAuth === 'cadastro'" @submit.prevent="fazerCadastro">
          <input v-model="formCadastro.nome" type="text" placeholder="Seu Nome Completo" required />
          <input v-model="formCadastro.email" type="email" placeholder="Seu E-mail" required />
          <input v-model="formCadastro.senha" type="password" placeholder="Crie uma Senha" required />
          <button type="submit" class="btn-acao">Cadastrar</button>
        </form>

        <form v-if="modoAuth === 'login'" @submit.prevent="fazerLogin">
          <input v-model="formLogin.email" type="email" placeholder="E-mail" required />
          <input v-model="formLogin.senha" type="password" placeholder="Senha" required />
          <button type="submit" class="btn-acao">Acessar Sistema</button>
        </form>
        
      </div>
    </div>

    <div v-if="telaAtual === 'paciente'">
      
      <div class="topo-sistema">
        <span>Bem-vindo(a), {{ nomeUsuario }}!</span>
        <div>
          <button 
            v-if="temAgendamentos && telaPaciente === 'agendar'" 
            @click="telaPaciente = 'listar'" 
            class="btn-secundario" 
            style="margin-right: 15px;">
            📅 Ver Meus Agendamentos
          </button>
          <button @click="sair" class="btn-sair">Sair</button>
        </div>
      </div>
      
      <FormularioClinica
        v-if="telaPaciente === 'agendar'"
        :nome-paciente="nomeUsuario" 
        :email-paciente="emailUsuario" 
        @agendamento-criado="verificarAgendamentos" 
      />

      <MeusAgendamentos 
        v-else-if="telaPaciente === 'listar'"
        :email-paciente="emailUsuario"
        @voltar="telaPaciente = 'agendar'"
      />
    </div>

    <div v-else-if="telaAtual === 'login-secretaria'" class="container-login-sec">
      <div class="card-login-sec">
        <h2>Área Restrita 🔒</h2>
        <p>Acesso exclusivo para funcionários da clínica.</p>
        
        <input 
          type="password" 
          v-model="senhaSecretaria" 
          placeholder="Digite a senha de acesso" 
          class="input-senha"
          @keyup.enter="fazerLoginSecretaria" 
        />
        
        <p v-if="erroSenhaSecretaria" class="erro-senha">{{ erroSenhaSecretaria }}</p>
        
        <div class="botoes-sec">
          <button @click="fazerLoginSecretaria" class="btn-entrar-sec">Entrar no Painel</button>
          <button @click="telaAtual = 'login'" class="btn-voltar-sec">Voltar</button>
          </div>
      </div>
    </div>

    <PainelSecretaria 
      v-else-if="telaAtual === 'painel-secretaria'" 
      @sair="telaAtual = 'login'" 
    />

    <div v-if="telaAtual === 'secretaria'">
      <div class="topo-sistema">
        <span>Painel Administrativo</span>
        <button @click="sair" class="btn-sair">Sair</button>
      </div>
      <PainelSecretaria />
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import FormularioClinica from './components/FormularioClinica.vue';
import PainelSecretaria from './components/PainelSecretaria.vue';
import MeusAgendamentos from './components/MeusAgendamentos.vue';

// variável para controlar qual tela o paciente está vendo
const telaPaciente = ref('agendar'); // Pode ser 'agendar' ou 'listar'
const temAgendamentos = ref(false);  // para controlar o botão

const telaAtual = ref('login'); 
const modoAuth = ref('login'); 

const nomeUsuario = ref('');
const emailUsuario = ref('');
const mensagem = ref('');
const sucesso = ref(false);

// Aqui estão as memórias separadas que criamos!
const formLogin = reactive({ email: '', senha: '' });
const formCadastro = reactive({ nome: '', email: '', senha: '' });

// Variáveis para o login da secretária
const senhaSecretaria = ref('');
const erroSenhaSecretaria = ref('');

// Função que valida a senha (estamos usando 'admin123' como senha padrão)
const fazerLoginSecretaria = () => {
  if (senhaSecretaria.value === 'admin123') {
    telaAtual.value = 'painel-secretaria'; // Libera o acesso e muda a tela!
    senhaSecretaria.value = ''; // Limpa o campo por segurança
    erroSenhaSecretaria.value = ''; // Limpa qualquer erro antigo
  } else {
    erroSenhaSecretaria.value = 'Senha incorreta. Acesso negado!';
  }
};

const fazerCadastro = async () => {
  try {
    const resposta = await axios.post('https://sistema-atendimento-inteligente-clinica.onrender.com/cadastro', formCadastro);
    mensagem.value = resposta.data.mensagem;
    sucesso.value = true;
    modoAuth.value = 'login'; 
    formCadastro.senha = ''; 
  } catch (error) {
    mensagem.value = error.response?.data?.erro || "Erro ao cadastrar.";
    sucesso.value = false;
  }
};

const fazerLogin = async () => {
  try {
    const resposta = await axios.post('https://sistema-atendimento-inteligente-clinica.onrender.com/login', formLogin);
    
    localStorage.setItem('tokenClinica', resposta.data.token);
    nomeUsuario.value = resposta.data.nome;
    emailUsuario.value = formLogin.email; 
    
    if (resposta.data.perfil === 'secretaria') {
      telaAtual.value = 'secretaria';
    } else {
      telaAtual.value = 'paciente';
      telaPaciente.value = 'agendar'; // Garante que abre no formulário
      verificarAgendamentos(); // Checa se o botão precisa aparecer
    }

    formLogin.email = ''; formLogin.senha = ''; mensagem.value = '';
  } catch (error) {
    mensagem.value = error.response?.data?.erro || "E-mail ou senha incorretos.";
    sucesso.value = false;
  }
};

const sair = () => {
  localStorage.removeItem('tokenClinica');
  telaAtual.value = 'login';
  modoAuth.value = 'login';
};

//função para olhar o banco de dados
const verificarAgendamentos = async () => {
  if (!emailUsuario.value) return;
  try {
    const resposta = await axios.get(`https://sistema-atendimento-inteligente-clinica.onrender.com/minhas-consultas/${emailUsuario.value}`);
    temAgendamentos.value = resposta.data && resposta.data.length > 0;
  } catch (error) {
    console.error("Erro ao checar histórico", error);
  }
};
</script>

<style>
body {
  background-color: #f4f7f6;
  margin: 0; font-family: Arial, sans-serif;    
}

.auth-container { 
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; 
}

.auth-box {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  width: 350px; text-align: center; 
}

.abas {
   display: flex;
   margin-bottom: 20px;
   border-bottom: 2px solid #eee;
}

.abas button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: bold;
  color: #888;
}

.abas button.ativo {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  margin-bottom: -2px; 
}

form input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.btn-acao {
  width: 100%; padding: 12px;
  background: #007bff;
  color: white; border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold; 
}

.btn-acao:hover {
   background: #0056b3; 
}

.topo-sistema {
  background: #333;
  color: white;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center; 
}

.btn-sair {
  background: #dc3545;
  color: white; 
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer; 
}

.btn-sair:hover {
   background: #c82333; 
}

.dica {
  font-size: 12px;
  color: #666;
  margin-top: 15px; 
}

.erro-texto {
   color: red; 
   margin-bottom: 10px; 
}

.sucesso-texto {
  color: green;
  margin-bottom: 10px;
}

.btn-acesso-restrito {
  background: transparent;
  border: 1px solid #ccc;
  color: #666;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 12px;
}
.btn-acesso-restrito:hover { background: #f1f1f1; }

.container-login-sec {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}
.card-login-sec {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
  width: 100%;
  max-width: 350px;
}
.input-senha {
  width: 100%;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
}
.erro-senha {
  color: #dc3545;
  font-size: 14px;
  margin-bottom: 15px;
}
.botoes-sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn-entrar-sec {
  background: #343a40;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.btn-voltar-sec {
  background: transparent;
  border: none;
  color: #666;
  text-decoration: underline;
  cursor: pointer;
}
</style>