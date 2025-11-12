// controllers/usuariosController.js
import Usuario from '../models/Usuario.js';
import Auditoria from '../models/Auditoria.js';
import bcrypt from 'bcryptjs';

/**
 * POST /api/v1/usuarios
 * Apenas admin cria.
 * Só solicitante precisa de supervisor.
 */
export const createUsuario = async (req, res) => {
  try {
    // apenas admin
    if (!req.user || req.user.indPerfUsuar !== 'admin') {
      return res.status(403).json({ erro: 'Apenas administradores podem criar usuários.' });
    }

    const {
      nomUsuar,
      dscEmailUsuar,
      dscSenhaUsuar,
      numTelUsuar,
      dscCargoUsuar,
      indPerfUsuar = 'solicitante',
      indStatUsuar = 'ativo',
      idSupervUsuar
    } = req.body;

    // se for solicitante => supervisor é obrigatório
    if (indPerfUsuar === 'solicitante' && !idSupervUsuar) {
      return res.status(400).json({ erro: 'Usuário com perfil solicitante deve ter supervisor.' });
    }

    // se não mandou senha, cria com padrão
    const senhaHash = dscSenhaUsuar
      ? await bcrypt.hash(dscSenhaUsuar, 12)
      : await bcrypt.hash('123456', 12);

    const novoUsuario = await Usuario.create({
      nomUsuar,
      dscEmailUsuar,
      dscSenhaUsuar: senhaHash,
      numTelUsuar,
      dscCargoUsuar,
      indPerfUsuar,
      indStatUsuar,
      // só grava supervisor se for solicitante
      idSupervUsuar: indPerfUsuar === 'solicitante' ? idSupervUsuar : undefined
    });

    // auditoria
    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: novoUsuario._id,
      dscTipoEntidAudit: 'Usuario',
      dscAcaoAudit: 'USUARIO_CRIAR',
      dscDetalAudit: `Usuário ${novoUsuario.nomUsuar} criado por ${req.user.nomUsuar || req.user.dscEmailUsuar}`
    });

    const retorno = novoUsuario.toObject();
    delete retorno.dscSenhaUsuar;

    return res.status(201).json(retorno);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === 11000) {
      return res.status(400).json({ erro: 'E-mail já cadastrado.' });
    }
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/v1/usuarios
 * Lista simples, sem paginate (teu model não tem paginate)
 */
export const getAllUsuarios = async (req, res) => {
  try {
    const filter = {};
    if (req.query.perfil) filter.indPerfUsuar = req.query.perfil;
    if (req.query.status) filter.indStatUsuar = req.query.status;

    const usuarios = await Usuario.find(filter)
      .select('-dscSenhaUsuar')
      .sort({ datCriUsuar: -1 })
      .populate('idSupervUsuar', 'nomUsuar dscEmailUsuar indPerfUsuar');

    return res.json({ usuarios });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/v1/usuarios/:id
 */
export const getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select('-dscSenhaUsuar')
      .populate('idSupervUsuar', 'nomUsuar dscEmailUsuar indPerfUsuar');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

/**
 * PUT /api/v1/usuarios/:id
 * - se não vier senha: mantém a antiga
 * - só solicitante precisa supervisor
 */
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // regra de permissão: admin pode tudo
    // se quiser deixar o próprio usuário editar o próprio cadastro, dá pra checar:
    // if (req.user.indPerfUsuar !== 'admin' && req.user.userId !== id) { ... }
    if (!req.user || req.user.indPerfUsuar !== 'admin') {
      return res.status(403).json({ erro: 'Apenas administradores podem alterar usuários.' });
    }

    const {
      nomUsuar,
      dscEmailUsuar,
      dscSenhaUsuar,
      numTelUsuar,
      dscCargoUsuar,
      indPerfUsuar,
      indStatUsuar,
      idSupervUsuar
    } = req.body;

    // aplica campos se vieram
    if (nomUsuar !== undefined) usuario.nomUsuar = nomUsuar;
    if (dscEmailUsuar !== undefined) usuario.dscEmailUsuar = dscEmailUsuar;
    if (numTelUsuar !== undefined) usuario.numTelUsuar = numTelUsuar;
    if (dscCargoUsuar !== undefined) usuario.dscCargoUsuar = dscCargoUsuar;
    if (indPerfUsuar !== undefined) usuario.indPerfUsuar = indPerfUsuar;
    if (indStatUsuar !== undefined) usuario.indStatUsuar = indStatUsuar;

    // SE veio senha => troca. SE não veio => mantém.
    if (dscSenhaUsuar) {
      usuario.dscSenhaUsuar = await bcrypt.hash(dscSenhaUsuar, 12);
    }

    // agora aplica a regra do supervisor:
    // se (perfil final) for solicitante => supervisor obrigatório
    const perfilFinal = usuario.indPerfUsuar;
    if (perfilFinal === 'solicitante') {
      if (!idSupervUsuar) {
        return res
          .status(400)
          .json({ erro: 'Usuário com perfil solicitante deve ter supervisor.' });
      }
      usuario.idSupervUsuar = idSupervUsuar;
    } else {
      // se não é solicitante, garante que não vai ficar lixo de supervisor
      usuario.idSupervUsuar = undefined;
    }

    await usuario.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: usuario._id,
      dscTipoEntidAudit: 'Usuario',
      dscAcaoAudit: 'ATUALIZACAO_USUARIO',
      dscDetalAudit: `Usuário ${usuario.nomUsuar} atualizado por ${req.user.nomUsuar || req.user.dscEmailUsuar}`
    });

    const retorno = usuario.toObject();
    delete retorno.dscSenhaUsuar;

    return res.json(retorno);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

/**
 * DELETE /api/v1/usuarios/:id
 */
export const deleteUsuario = async (req, res) => {
  try {
    if (!req.user || req.user.indPerfUsuar !== 'admin') {
      return res.status(403).json({ erro: 'Apenas administradores podem excluir usuários.' });
    }

    const { id } = req.params;
    const usuario = await Usuario.findByIdAndDelete(id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: id,
      dscTipoEntidAudit: 'Usuario',
      dscAcaoAudit: 'EXCLUSAO_USUARIO',
      dscDetalAudit: `Usuário ${usuario.nomUsuar} excluído por ${req.user.nomUsuar || req.user.dscEmailUsuar}`
    });

    return res.json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};
