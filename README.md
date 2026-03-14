
# 🏥 Sistema de Agendamento Inteligente - Clínica Médica

Este é um sistema completo (Full-Stack) desenvolvido para o processo de agendamento de consultas de uma clínica médica, cumprindo e expandindo todos os requisitos acadêmicos propostos. O projeto contempla um fluxo completo de ponta a ponta: desde a autenticação de usuários até um CRUD completo de consultas e integração com APIs externas.

## 🚀 Como Rodar Online (Live Demo)

O sistema está totalmente hospedado na nuvem e pode ser acessado e testado por qualquer navegador, sem necessidade de baixar ou instalar nada.

* **Acesse a Aplicação (Front-end na Vercel):** [https://sistema-atendimento-clinica-medica.vercel.app/](https://sistema-atendimento-clinica-medica.vercel.app/)
* **API (Back-end no Render):** [https://sistema-atendimento-inteligente-clinica.onrender.com](https://sistema-atendimento-inteligente-clinica.onrender.com)

> **💡 Dica de Teste:** Como a API está hospedada no plano gratuito do Render, o servidor "adormece" após um período de inatividade. O primeiro acesso/agendamento do dia pode levar de 30 a 50 segundos para responder enquanto o servidor "acorda". Os acessos seguintes serão instantâneos.

---

## 💻 Tecnologias Utilizadas

* **Front-end:** Vue.js 3 + Vite (Reatividade, Componentização e Build otimizado).
* **Back-end:** Node.js com Express e TypeScript.
* **Banco de Dados:** SQLite (com criação dinâmica de tabelas).
* **Segurança:** Autenticação via tokens JWT (JSON Web Tokens) e proteção de variáveis de ambiente.
* **Deploy:** Vercel (Front-end) e Render (Back-end).
* **Integrações (APIs Externas):**
* **ViaCEP:** Preenchimento automático de endereço do paciente.
* **OpenWeatherMap:** Previsão do tempo renderizada dinamicamente na tabela de agendamentos para consultas em até 5 dias.



---

## ✨ Funcionalidades Implementadas

* [x] Cadastro e login seguro com separação de perfis (Paciente / Secretária).
* [x] Proteção de rotas administrativas (Middleware JWT / Controle de Tela).
* [x] Sistema CRUD completo para o paciente (Criar, Ler, Atualizar/Remarcar e Cancelar consultas).
* [x] Bloqueio automático de horários duplicados no banco de dados.
* [x] Consulta de endereço automática e dinâmica pelo CEP.
* [x] Painel Administrativo exclusivo para a secretária (Visão geral de todos os pacientes, com poder de cancelamento).
* [x] Painel exclusivo do Paciente para visualizar o histórico de agendamentos.
* [x] Previsão do clima exata para o dia e o bairro da consulta integrada à tabela.

---

## 🔑 Credenciais de Acesso para Teste

O sistema possui controle de acesso com perfis diferentes. Para testar o sistema online pelo link da Vercel, utilize:

**Acesso Secretária (Painel Administrativo):**

* Na tela inicial, clique no botão "Acesso da Secretária".
* **Senha de acesso:** `admin123` *(Conforme configurado para demonstração)*.

**Acesso Paciente (Agendamento):**

* Na tela inicial, utilize o formulário para registrar um novo paciente ou faça login com uma conta previamente criada para testar o agendamento e o painel "Minhas Consultas".

---

## ⚙️ Como Rodar Localmente (Ambiente de Desenvolvimento)

Caso deseje baixar o código e rodar a aplicação em sua própria máquina, siga os passos abaixo.

### ⚠️ Pré-requisito (Variáveis de Ambiente)

No diretório do Front-end, crie um arquivo chamado `.env` e adicione a sua chave da API do OpenWeather para que a previsão do tempo funcione localmente:
`VITE_OPENWEATHER=sua_chave_api_aqui`

### PASSO 1: Iniciando o Back-end (Servidor)

1. Abra um terminal e acesse a pasta do backend:
```bash
cd backend

```


2. Instale as dependências do projeto:
```bash
npm install

```


3. Inicie o servidor:
```bash
npm run dev

```



> **Nota:** O servidor local rodará na porta 3000. Certifique-se de que a `baseUrl` no Front-end esteja apontando para `http://localhost:3000` caso queira usar a API local em vez da nuvem.

### PASSO 2: Iniciando o Front-end (Interface Vue.js)

1. Abra um NOVO terminal (mantenha o do backend rodando) e acesse a pasta do frontend:
```bash
cd frontend

```


2. Instale as dependências:
```bash
npm install

```


3. Inicie a aplicação Vue:
```bash
npm run dev

```


4. O terminal mostrará um link local (geralmente `http://localhost:5173`). Segure a tecla CTRL e clique no link para abrir o sistema no navegador.

---

> **Nota de Decisão Arquitetural (Banco de Dados):**
> Inicialmente, o projeto foi configurado com MongoDB Atlas em nuvem. No entanto, devido a bloqueios comuns de DNS (querySrv ECONNREFUSED) realizados por alguns provedores de internet locais, a conexão externa sofria timeout. Para garantir a execução do projeto localmente de forma imediata e sem falhas de infraestrutura de rede, optei por migrar a persistência de dados para o **SQLite** (banco relacional embutido).

---
