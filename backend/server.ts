import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors());
app.use(express.json());

const SEGREDO = 'chave_secreta_faculdade_123';
let db: any;

// ==========================================
// INICIALIZAÇÃO DO BANCO DE DADOS
// ==========================================
async function iniciarBanco() {
  db = await open({
    filename: './banco_clinica_v2.sqlite', // Cria o banco para o Render
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha TEXT,
      perfil TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      especialidade TEXT,
      email TEXT,
      cep TEXT,
      logradouro TEXT,
      bairro TEXT,
      cidade TEXT,
      dataConsulta TEXT,
      horaConsulta TEXT
    )
  `);

  const adminEmail = 'admin@clinica.com';
  const admin = await db.get(`SELECT * FROM usuarios WHERE email = ?`, [adminEmail]);
  if (!admin) {
    await db.run(
      `INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)`, 
      ['Admin', adminEmail, '123', 'secretaria']
    );
  }
}

iniciarBanco();

// ==========================================
// VALIDAÇÕES E MIDDLEWARES
// ==========================================
const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarNome = (nome: string) => /^[a-zA-ZÀ-ÿ\s]{5,}$/.test(nome);

const verificarToken = (req: Request, res: Response, next: NextFunction): any => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) return res.status(403).json({ erro: 'Acesso negado.' });

  try {
    const tokenLimpo = tokenHeader.split(' ')[1]; 
    jwt.verify(tokenLimpo, SEGREDO);
    next(); 
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido!' });
  }
};

// ==========================================
// SEGURANÇA E USUÁRIOS
// ==========================================
app.post('/cadastro', async (req: Request, res: Response): Promise<any> => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos!' });
  if (!validarNome(nome)) return res.status(400).json({ erro: 'Nome inválido! Mínimo de 5 letras.' });
  if (!validarEmail(email)) return res.status(400).json({ erro: 'E-mail inválido!' });

  try {
    const usuarioExiste = await db.get(`SELECT * FROM usuarios WHERE email = ?`, [email]);
    if (usuarioExiste) return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });

    await db.run(`INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)`, [nome, email, senha, 'paciente']);
    return res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar no banco.' });
  }
});

app.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, senha } = req.body;
  const usuario = await db.get(`SELECT * FROM usuarios WHERE email = ? AND senha = ?`, [email, senha]);

  if (usuario) {
    const token = jwt.sign({ perfil: usuario.perfil }, SEGREDO, { expiresIn: '1h' });
    return res.json({ token, perfil: usuario.perfil, nome: usuario.nome });
  }
  return res.status(401).json({ erro: 'E-mail ou senha incorretos!' });
});


// ==========================================
//  ROTAS DE AGENDAMENTO (PACIENTE)
// ==========================================

// 1. Criar Consulta
app.post('/agendamento', async (req: Request, res: Response): Promise<any> => {
  const { nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta } = req.body;

  if (!nome || !email || !especialidade || !cep || !dataConsulta || !horaConsulta) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios!" });
  }
  if (!validarNome(nome)) return res.status(400).json({ erro: 'Nome inválido.' });

  // 🎯 REGRA 1: O paciente já tem consulta nesse mesmo dia e hora em QUALQUER lugar?
  const pacienteOcupado = await db.get(
    `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ? AND email = ?`,
    [dataConsulta, horaConsulta, email]
  );
  if (pacienteOcupado) {
    return res.status(400).json({ erro: "mesmo horario reservado em outra unidade" });
  }

  // 🎯 REGRA 2: A Unidade (bairro) já está com esse horário preenchido por outra pessoa?
  const unidadeOcupada = await db.get(
    `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ? AND bairro = ?`, 
    [dataConsulta, horaConsulta, bairro]
  );
  if (unidadeOcupada) {
    return res.status(400).json({ erro: `Este horário já está reservado na unidade ${bairro}!` });
  }

  // Se passou nas duas regras, salva no banco!
  try {
    await db.run(
      `INSERT INTO consultas (nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta]
    );
    return res.status(201).json({ mensagem: "Agendamento confirmado!" });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar agendamento.' });
  }
});

// ==========================================
// 3. EDITAR CONSULTA (Com dupla verificação)
// ==========================================
app.put('/agendamento/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { dataConsulta, horaConsulta, especialidade } = req.body;

  if (!dataConsulta || !horaConsulta || !especialidade) {
    return res.status(400).json({ erro: 'Preencha os dados para atualizar.' });
  }

  // Puxa os dados da consulta atual para saber o email e o bairro
  const consultaAtual = await db.get(`SELECT email, bairro FROM consultas WHERE id = ?`, [id]);

  if (consultaAtual) {
    // 🎯 REGRA 1: O paciente já tem OUTRA consulta nesse horário? (Ignorando a consulta que ele está editando agora)
    const pacienteOcupado = await db.get(
      `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ? AND email = ? AND id != ?`,
      [dataConsulta, horaConsulta, consultaAtual.email, id]
    );
    if (pacienteOcupado) {
      return res.status(400).json({ erro: "mesmo horario reservado em outra unidade" });
    }

    // 🎯 REGRA 2: A Unidade já está lotada nesse horário?
    const unidadeOcupada = await db.get(
      `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ? AND bairro = ? AND id != ?`,
      [dataConsulta, horaConsulta, consultaAtual.bairro, id]
    );
    if (unidadeOcupada) {
      return res.status(400).json({ erro: `Este horário já está reservado na unidade ${consultaAtual.bairro} por outro paciente!` });
    }
  }

  // Se passou nas regras, atualiza!
  try {
    await db.run(
      `UPDATE consultas SET dataConsulta = ?, horaConsulta = ?, especialidade = ? WHERE id = ?`,
      [dataConsulta, horaConsulta, especialidade, id]
    );
    return res.json({ mensagem: 'Agendamento atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar o agendamento.' });
  }
});

// 2. Buscar Consultas do Paciente
app.get('/minhas-consultas/:email', async (req: Request, res: Response) => {
  const minhasConsultas = await db.all(
    `SELECT * FROM consultas WHERE email = ? ORDER BY dataConsulta ASC, horaConsulta ASC`, 
    [req.params.email]
  );
  res.json(minhasConsultas);
});

// 3. Editar Consulta
app.put('/agendamento/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { dataConsulta, horaConsulta, especialidade } = req.body;

  if (!dataConsulta || !horaConsulta || !especialidade) {
    return res.status(400).json({ erro: 'Preencha os dados para atualizar.' });
  }

  // 🎯 Passo 1: Descobrir em qual bairro (unidade) é esta consulta antes de editar
  const consultaAtual = await db.get(`SELECT bairro FROM consultas WHERE id = ?`, [id]);

  if (consultaAtual) {
    // 🎯 Passo 2: Verifica se alguém já marcou nesse mesmo bairro, dia e hora
    const horarioOcupado = await db.get(
      `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ? AND bairro = ? AND id != ?`,
      [dataConsulta, horaConsulta, consultaAtual.bairro, id]
    );

    if (horarioOcupado) {
      return res.status(400).json({ erro: `Este horário já está reservado na unidade ${consultaAtual.bairro} por outro paciente!` });
    }
  }

  try {
    await db.run(
      `UPDATE consultas SET dataConsulta = ?, horaConsulta = ?, especialidade = ? WHERE id = ?`,
      [dataConsulta, horaConsulta, especialidade, id]
    );
    return res.json({ mensagem: 'Agendamento atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar o agendamento.' });
  }
});

// 4. Deletar Consulta
app.delete('/agendamento/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await db.run(`DELETE FROM consultas WHERE id = ?`, [id]);
    return res.json({ mensagem: 'Agendamento cancelado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao cancelar o agendamento.' });
  }
});

// ==========================================
// ROTA DA SECRETÁRIA (VER TODAS AS CONSULTAS)
// ==========================================
app.get('/consultas', async (req: Request, res: Response): Promise<any> => {
  try {
    const todasConsultas = await db.all(
      `SELECT * FROM consultas ORDER BY dataConsulta ASC, horaConsulta ASC`
    );
    return res.json(todasConsultas);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar todas as consultas.' });
  }
});

// ==========================================
//  START DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}! 🏥`);
});

// ==========================================
// 📋 ROTA PARA BUSCAR PACIENTES CADASTRADOS
// ==========================================
app.get('/pacientes', async (req: Request, res: Response): Promise<any> => {
  try {
    const pacientes = await db.all(`SELECT id, nome, email FROM usuarios WHERE perfil = 'paciente'`);
    return res.json(pacientes);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
  }
});