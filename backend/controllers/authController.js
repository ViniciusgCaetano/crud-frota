// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES = '8h';

function montarUsuarioRetorno(usuarioDoc) {
  return {
    _id: usuarioDoc._id,
    nomUsuar: usuarioDoc.nomUsuar,
    dscEmailUsuar: usuarioDoc.dscEmailUsuar,
    indPerfUsuar: usuarioDoc.indPerfUsuar,
    indStatUsuar: usuarioDoc.indStatUsuar,
    dscCargoUsuar: usuarioDoc.dscCargoUsuar,
    numTelUsuar: usuarioDoc.numTelUsuar,
    idSupervUsuar: usuarioDoc.idSupervUsuar
      ? {
          _id: usuarioDoc.idSupervUsuar._id,
          nomUsuar: usuarioDoc.idSupervUsuar.nomUsuar,
          dscEmailUsuar: usuarioDoc.idSupervUsuar.dscEmailUsuar,
          indPerfUsuar: usuarioDoc.idSupervUsuar.indPerfUsuar,
        }
      : null,
    datCriUsuar: usuarioDoc.datCriUsuar,
    datAtualUsuar: usuarioDoc.datAtualUsuar,
  };
}

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    const usuario = await Usuario.findOne({ dscEmailUsuar: email })
      .populate('idSupervUsuar', 'nomUsuar dscEmailUsuar indPerfUsuar')
      .exec();

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(senha, usuario.dscSenhaUsuar);
    if (!ok) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    if (usuario.indStatUsuar && usuario.indStatUsuar !== 'ativo') {
      return res.status(403).json({ erro: 'Usuário inativo ou bloqueado.' });
    }

    // ATENÇÃO: assina com { userId, perfil, email }
    const token = jwt.sign(
      {
        userId: usuario._id.toString(),
        perfil: usuario.indPerfUsuar,
        email: usuario.dscEmailUsuar,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      token,
      usuario: montarUsuarioRetorno(usuario),
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

export const validarToken = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.userId)
      .populate('idSupervUsuar', 'nomUsuar dscEmailUsuar indPerfUsuar')
      .exec();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json({
      usuario: montarUsuarioRetorno(usuario),
    });
  } catch (err) {
    console.error('Erro ao validar token:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

export const seedAdmin = async (req, res) => {
  try {
    const existe = await Usuario.findOne({ dscEmailUsuar: 'admin@empresa.com' });
    if (existe) {
      return res.json({ mensagem: 'Admin já existe.' });
    }

    const senhaHash = await bcrypt.hash('admin123', 12);

    const admin = await Usuario.create({
      nomUsuar: 'Administrador do Sistema',
      dscEmailUsuar: 'admin@empresa.com',
      dscSenhaUsuar: senhaHash,
      indPerfUsuar: 'admin',
      indStatUsuar: 'ativo',
    });

    return res.status(201).json({
      mensagem: 'Admin criado.',
      admin: {
        _id: admin._id,
        dscEmailUsuar: admin.dscEmailUsuar,
      },
    });
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};
