# sistema_atendimento_inteligente_clinica_medica
uma aplicação web para atendimento clínico, integrando informações com serviços de terceiros e garantindo segurança no acesso de dados.

======================================================
🏥 SISTEMA DE AGENDAMENTO INTELIGENTE - CLÍNICA MÉDICA
======================================================

Este projeto é composto por duas partes: o Back-end (Node.js) e o Front-end (Vue.js). 
Para avaliar o sistema, é necessário rodar ambas as pastas em terminais separados.

⚠️ AVISO IMPORTANTE SOBRE O BANCO DE DADOS:
Nesta versão, o sistema utiliza um banco de dados em memória (Arrays no servidor) para garantir a execução imediata sem necessidade de configurações externas de rede ou instalação de bancos de dados locais. 
*Nota: Ao reiniciar o servidor Back-end, os pacientes cadastrados serão limpos.*


🛠️ PASSO 1: INICIANDO O BACK-END (SERVIDOR)
------------------------------------------------------
1. Abra um terminal e acesse a pasta do backend:
   cd backend

2. Instale as dependências do projeto:
   npm install

3. Inicie o servidor:
   npm run dev

O servidor estará rodando na porta 3000 (http://localhost:3000).


💻 PASSO 2: INICIANDO O FRONT-END (INTERFACE VUE.JS)
------------------------------------------------------
1. Abra um NOVO terminal (mantenha o do backend rodando) e acesse a pasta do frontend:
   cd frontend

2. Instale as dependências:
   npm install

3. Inicie a aplicação Vue:
   npm run dev

4. O terminal mostrará um link local (geralmente http://localhost:5173). Segure a tecla CTRL e clique no link para abrir o sistema no navegador.


🔐 CREDENCIAIS DE ACESSO PARA TESTE
------------------------------------------------------
O sistema possui controle de rotas via JWT com perfis diferentes.

* Acesso Secretária (Painel Administrativo):
  - E-mail: admin@clinica.com
  - Senha: 123
  (Este usuário já vem pré-cadastrado no sistema).

* Acesso Paciente (Agendamento):
  - Na tela inicial, clique na aba "Criar Conta" para registrar um novo paciente e fazer o login.


🌟 FUNCIONALIDADES INTEGRADAS PARA AVALIAÇÃO:
------------------------------------------------------
- [x] Cadastro e login seguro com separação de perfis (Paciente/Secretária).
- [x] Proteção de rotas administrativas com token JWT.
- [x] Agendamento com bloqueio de horários duplicados.
- [x] Consulta automática de endereço via API do ViaCEP.
- [x] Previsão do tempo no dia da consulta via API OpenWeatherMap.
- [x] Painel administrativo exclusivo para a secretária visualizar todos os agendamentos.
- [x] Painel exclusivo do paciente para visualizar suas próprias consultas.
