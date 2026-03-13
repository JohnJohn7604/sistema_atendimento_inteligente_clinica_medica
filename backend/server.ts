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

async function iniciarBanco() {
  db = await open({
    filename: './banco_clinica.sqlite',
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

  // Criamos o Admin apenas se não existir, sem exibir os dados abertamente no console.log
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
// 🛡️ VALIDAÇÕES
// ==========================================
const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarNome = (nome: string) => /^[a-zA-ZÀ-ÿ\s]{5,}$/.test(nome); // Agora ajustado para 5 letras no comentário também

// ==========================================
// 🔐 SEGURANÇA E USUÁRIOS
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
// 🚀 ROTAS DE AGENDAMENTO (FIXED)
// ==========================================
app.post('/agendamento', async (req: Request, res: Response): Promise<any> => {
  const { nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta } = req.body;

  if (!nome || !email || !especialidade || !cep || !dataConsulta || !horaConsulta) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios, incluindo a especialidade!" });
  }

  if (!validarNome(nome)) return res.status(400).json({ erro: 'Nome inválido.' });

  const horarioOcupado = await db.get(
    `SELECT * FROM consultas WHERE dataConsulta = ? AND horaConsulta = ?`, 
    [dataConsulta, horaConsulta]
  );
  
  if (horarioOcupado) {
    return res.status(400).json({ erro: "Este horário já está reservado!" });
  }

  // AGORA SALVANDO A ESPECIALIDADE CORRETAMENTE
  await db.run(
    `INSERT INTO consultas (nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, email, especialidade, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta]
  );

  return res.status(201).json({ mensagem: "Agendamento confirmado!" });
});

app.get('/consultas', verificarToken, async (req: Request, res: Response) => {
  const todasConsultas = await db.all(`SELECT * FROM consultas`);
  res.json(todasConsultas);
});

app.get('/minhas-consultas/:email', async (req: Request, res: Response) => {
  const minhasConsultas = await db.all(`SELECT * FROM consultas WHERE email = ?`, [req.params.email]);
  res.json(minhasConsultas);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando! 🏥`);
});