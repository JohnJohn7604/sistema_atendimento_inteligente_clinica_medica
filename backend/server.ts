import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors());
app.use(express.json());

const SEGREDO = 'chave_secreta_faculdade_123';

// ==========================================
// 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS SQLITE
// ==========================================
let db: any;

// Função que inicia o banco e cria as tabelas se não existirem
async function iniciarBanco() {
  db = await open({
    filename: './banco_clinica.sqlite', // O arquivo que será criado na sua pasta!
    driver: sqlite3.Database
  });

  // Cria a tabela de Usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha TEXT,
      perfil TEXT
    )
  `);

  // Cria a tabela de Consultas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT,
      cep TEXT,
      logradouro TEXT,
      bairro TEXT,
      cidade TEXT,
      dataConsulta TEXT,
      horaConsulta TEXT
    )
  `);

  // Verifica se a Secretária já existe, se não, cadastra ela
  const admin = await db.get(`SELECT * FROM usuarios WHERE email = ?`, ['admin@clinica.com']);
  if (!admin) {
    await db.run(
      `INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)`, 
      ['Admin', 'admin@clinica.com', '123', 'secretaria']
    );
    console.log('👩‍💻 Conta da secretária criada no banco!');
  }
}

// Inicia o banco assim que o arquivo é lido
iniciarBanco();

// ==========================================
// 🔐 ÁREA DE SEGURANÇA E USUÁRIOS
// ==========================================
app.post('/cadastro', async (req: Request, res: Response): Promise<any> => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos!' });

  try {
    const usuarioExiste = await db.get(`SELECT * FROM usuarios WHERE email = ?`, [email]);
    if (usuarioExiste) return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });

    await db.run(`INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)`, [nome, email, senha, 'paciente']);
    return res.status(201).json({ mensagem: 'Conta criada com sucesso! Faça seu login.' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar no banco de dados.' });
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
// 🚀 ROTAS DE AGENDAMENTO DA CLÍNICA
// ==========================================
app.get('/consultas', verificarToken, async (req: Request, res: Response) => {
  const todasConsultas = await db.all(`SELECT * FROM consultas`);
  res.json(todasConsultas);
});

app.get('/minhas-consultas/:email', async (req: Request, res: Response) => {
  const minhasConsultas = await db.all(`SELECT * FROM consultas WHERE email = ?`, [req.params.email]);
  res.json(minhasConsultas);
});

app.post('/agendamento', async (req: Request, res: Response): Promise<any> => {
  const { nome, email, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta } = req.body;

  if (!nome || !email || !cep || !dataConsulta || !horaConsulta) {
    return res.status(400).json({ erro: "Preencha todos os campos, incluindo a hora!" });
  }

  // Verifica horários no banco
  const horarioOcupado = await db.get(
    `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ?`, 
    [dataConsulta, horaConsulta]
  );
  
  if (horarioOcupado) {
    return res.status(400).json({ erro: "Este horário já está reservado. Escolha outro!" });
  }

  // Salva a consulta
  await db.run(
    `INSERT INTO consultas (nome, email, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, email, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta]
  );

  return res.status(201).json({ mensagem: "Agendamento confirmado com sucesso!" });
});

app.listen(3000, () => {
  console.log("Servidor da Clínica rodando na porta 3000 com SQLite! 🏥🗄️");
});