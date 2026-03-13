#  Sistema de Agendamento Inteligente - Clínica Médica

Este é um sistema completo (Full-Stack) desenvolvido para o processo de agendamento de consultas de uma clínica médica, cumprindo todos os requisitos acadêmicos propostos.

##  Tecnologias Utilizadas
- **Front-end:** Vue.js (Reatividade e Componentização)
- **Back-end:** Node.js com Express
- **Banco de Dados:** SQLite 
- **Segurança:** Autenticação via tokens JWT (JSON Web Tokens)
- **Integrações (APIs Externas):**
- **ViaCEP:** Preenchimento automático de endereço.
- **OpenWeatherMap:** Previsão do tempo e alertas para o dia da consulta.


 PASSO 1: INICIANDO O BACK-END (SERVIDOR)
------------------------------------------------------
1. Abra um terminal e acesse a pasta do backend:
   cd backend

2. Instale as dependências do projeto:
   npm install

3. Inicie o servidor:
   npm run dev

O servidor estará rodando na porta 3000 (https://sistema-atendimento-inteligente-clinica.onrender.com).

 PASSO 2: INICIANDO O FRONT-END (INTERFACE VUE.JS)
------------------------------------------------------
1. Abra um NOVO terminal (mantenha o do backend rodando) e acesse a pasta do frontend:
   cd frontend

2. Instale as dependências:
   npm install

3. Inicie a aplicação Vue:
   npm run dev

4. O terminal mostrará um link local (geralmente http://localhost:5173). Segure a tecla CTRL e clique no link para abrir o sistema no navegador.


 CREDENCIAIS DE ACESSO PARA TESTE
------------------------------------------------------
O sistema possui controle de rotas via JWT com perfis diferentes.

* Acesso Secretária (Painel Administrativo):
  - E-mail: admin@clinica.com
  - Senha: 123
  (Este usuário já vem pré-cadastrado no sistema).

* Acesso Paciente (Agendamento):
  - Na tela inicial, clique na aba "Criar Conta" para registrar um novo paciente e fazer o login.


 FUNCIONALIDADES IMPLEMENTADAS:
------------------------------------------------------
- [x] Cadastro e login seguro com separação de perfis (Paciente / Secretária).
- [x] Proteção de rotas administrativas (Middleware JWT).
- [x] Agendamento de consultas com bloqueio automático de horários duplicados.
- [x] Consulta de endereço automática pelo CEP.
- [x] Alerta de clima/chuva para o dia do atendimento.
- [x] Painel Administrativo exclusivo para a secretária.
- [x] Painel exclusivo do Paciente para visualizar o histórico de agendamentos.
- [x] Banco de dados SQL real e persistente.

> **Nota de Decisão Arquitetural (Banco de Dados):**
> Inicialmente, o projeto foi configurado com MongoDB Atlas em nuvem. No entanto, devido a bloqueios comuns de DNS (querySrv ECONNREFUSED) realizados por alguns provedores de internet locais, a conexão externa sofria timeout. Para garantir a execução do projeto localmente de forma imediata e sem falhas de infraestrutura de rede, optei por migrar a persistência de dados para o **SQLite** (banco relacional embutido).
