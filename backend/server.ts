import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const SEGREDO = 'chave_secreta_faculdade_123';

// ==========================================
// BANCO DE DADOS EM MEMORIA
// ==========================================
interface Paciente {
  nome: string; email: string; cep: string; logradouro: string;
  bairro: string; cidade: string; dataConsulta: string; horaConsulta: string;
}

const consultas: Paciente[] = [];

// O Admin (Secretária) já vem cadastrado por padrão
const usuarios = [
  { nome: 'Admin', email: 'admin@clinica.com', senha: '123', perfil: 'secretaria' }
];

// ==========================================
// ÁREA DE SEGURANÇA E USUÁRIOS
// ==========================================
app.post('/cadastro', (req: Request, res: Response): any => {
  const { nome, email, senha } = req.body;
  
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos para cadastrar!' });
  }

  const usuarioExiste = usuarios.find(u => u.email === email);
  if (usuarioExiste) {
    return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  usuarios.push({ nome, email, senha, perfil: 'paciente' });
  return res.status(201).json({ mensagem: 'Conta criada com sucesso! Faça seu login.' });
});

app.post('/login', (req: Request, res: Response): any => {
  const { email, senha } = req.body;
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

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
// ROTAS DE AGENDAMENTO
// ==========================================
app.get('/consultas', verificarToken, (req: Request, res: Response) => {
  res.json(consultas);
});

app.get('/minhas-consultas/:email', (req: Request, res: Response) => {
  const minhasConsultas = consultas.filter(c => c.email === req.params.email);
  res.json(minhasConsultas);
});

app.post('/agendamento', (req: Request, res: Response): any => {
  const { nome, email, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta } = req.body;

  if (!nome || !email || !cep || !dataConsulta || !horaConsulta) {
    return res.status(400).json({ erro: "Preencha todos os campos, incluindo a hora!" });
  }

  const horarioOcupado = consultas.find(c => c.dataConsulta === dataConsulta && c.horaConsulta === horaConsulta);
  if (horarioOcupado) {
    return res.status(400).json({ erro: "Este horário já está reservado. Escolha outro!" });
  }

  const novoPaciente: Paciente = { nome, email, cep, logradouro, bairro, cidade, dataConsulta, horaConsulta };
  consultas.push(novoPaciente);

  return res.status(201).json({ 
    mensagem: "Agendamento confirmado com sucesso!",
    paciente: novoPaciente 
  });
});

app.listen(3000, () => {
  console.log("Servidor da Clínica rodando na porta 3000! 🏥🔐");
});