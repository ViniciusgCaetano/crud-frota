// controllers/beneficiosController.js
import Alocacao from '../models/Alocacao.js';
import Veiculo from '../models/Veiculo.js';
import Usuario from '../models/Usuario.js';
import Auditoria from '../models/Auditoria.js';

const AuditAction = Object.freeze({
  CRIAR: 'ALOCACAO_CRIAR',
  ATUALIZAR: 'ALOCACAO_ATUALIZAR',
  ENCERRAR: 'ALOCACAO_ENCERRAR'
});

// POST /api/v1/beneficios
export const criarAlocacao = async (req, res) => {
  try {
    const {
      idUsuarAloc,
      idVeicAloc,
      idMotExclAloc,
      indFdsAloc,
      dscLocalEstacAloc,
      numPriorAloc,
      dscJustfAloc,
      datInicioAloc,
      datFimAloc
    } = req.body;

    // 1) validar usuário
    const usuario = await Usuario.findById(idUsuarAloc);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário beneficiado não encontrado.' });
    }

    // 2) validar veículo
    const veic = await Veiculo.findById(idVeicAloc);
    if (!veic) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    // 3) impedir 2 alocações ativas para o mesmo usuário
    const existeAlocUsuario = await Alocacao.findOne({
      idUsuarAloc,
      indStatAloc: 'ativa'
    });
    if (existeAlocUsuario) {
      return res.status(400).json({ erro: 'Usuário já possui alocação ativa.' });
    }

    // 4) impedir 2 alocações ativas para o mesmo veículo
    const existeAlocVeiculo = await Alocacao.findOne({
      idVeicAloc,
      indStatAloc: 'ativa'
    });
    if (existeAlocVeiculo) {
      return res.status(400).json({ erro: 'Veículo já está alocado para outro usuário.' });
    }

    // 5) se informar motorista exclusivo, validar
    let motoristaDoc = null;
    if (idMotExclAloc) {
      motoristaDoc = await Usuario.findById(idMotExclAloc);
      if (!motoristaDoc) {
        return res.status(400).json({ erro: 'Motorista exclusivo informado não existe.' });
      }
    }

    // 6) criar alocação
    const alocacao = await Alocacao.create({
      idUsuarAloc,
      idVeicAloc,
      idMotExclAloc: idMotExclAloc || undefined,
      indFdsAloc: typeof indFdsAloc === 'boolean' ? indFdsAloc : false,
      dscLocalEstacAloc: dscLocalEstacAloc || '',
      numPriorAloc: typeof numPriorAloc === 'number' ? numPriorAloc : 0,
      dscJustfAloc: dscJustfAloc || '',
      datInicioAloc: datInicioAloc ? new Date(datInicioAloc) : new Date(),
      datFimAloc: datFimAloc ? new Date(datFimAloc) : undefined,
      indStatAloc: 'ativa',
      datCriAloc: new Date(),
      datAtualAloc: new Date()
    });

    // 7) marcar veículo como reservado/alocado
    veic.indStatVeic = 'reservado';
    await veic.save();

    // 8) auditoria
    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: alocacao._id,
      dscTipoEntidAudit: 'Alocacao',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: `Veículo ${veic.dscModelVeic} (${veic.dscPlacaVeic}) alocado para usuário ${usuario.nomUsuar}.`,
      indResultAudit: 'sucesso'
    });

    return res.status(201).json(alocacao);
  } catch (error) {
    console.error('Erro ao criar alocação:', error);
    // auditoria de erro sem idEntid
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Alocacao',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    return res.status(500).json({ erro: 'Erro ao criar alocação.' });
  }
};

// GET /api/v1/beneficios
// suporta ?vigente=true e ?usuario=<id>
export const getAlocacoes = async (req, res) => {
  try {
    const { vigente, usuario } = req.query;

    const filter = {};
    if (vigente === 'true') {
      filter.indStatAloc = 'ativa';
    }
    if (usuario) {
      filter.idUsuarAloc = usuario;
    }

    const alocacoes = await Alocacao.find(filter)
      .populate('idUsuarAloc', 'nomUsuar dscEmailUsuar indPerfUsuar')
      .populate('idVeicAloc', 'dscModelVeic dscPlacaVeic dscTipoVeic')
      .populate('idMotExclAloc', 'nomUsuar dscEmailUsuar')
      .sort({ datCriAloc: -1 });

    return res.json(alocacoes);
  } catch (error) {
    console.error('Erro ao listar alocações:', error);
    return res.status(500).json({ erro: 'Erro ao listar alocações.' });
  }
};

// PUT /api/v1/beneficios/:id
// atualizar metadados da alocação (motorista, fds, local, prioridade, justificativa)
export const atualizarAlocacao = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      idMotExclAloc,
      indFdsAloc,
      dscLocalEstacAloc,
      numPriorAloc,
      dscJustfAloc,
      datFimAloc
    } = req.body;

    const aloc = await Alocacao.findById(id);
    if (!aloc) {
      return res.status(404).json({ erro: 'Alocação não encontrada.' });
    }

    // se veio motorista, validar
    if (idMotExclAloc) {
      const mot = await Usuario.findById(idMotExclAloc);
      if (!mot) {
        return res.status(400).json({ erro: 'Motorista exclusivo informado não existe.' });
      }
      aloc.idMotExclAloc = idMotExclAloc;
    } else if (idMotExclAloc === null) {
      // se quiser permitir remover motorista
      aloc.idMotExclAloc = undefined;
    }

    if (typeof indFdsAloc === 'boolean') {
      aloc.indFdsAloc = indFdsAloc;
    }
    if (typeof dscLocalEstacAloc === 'string') {
      aloc.dscLocalEstacAloc = dscLocalEstacAloc;
    }
    if (typeof numPriorAloc === 'number') {
      aloc.numPriorAloc = numPriorAloc;
    }
    if (typeof dscJustfAloc === 'string') {
      aloc.dscJustfAloc = dscJustfAloc;
    }
    if (datFimAloc) {
      aloc.datFimAloc = new Date(datFimAloc);
    }

    aloc.datAtualAloc = new Date();

    await aloc.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: aloc._id,
      dscTipoEntidAudit: 'Alocacao',
      dscAcaoAudit: AuditAction.ATUALIZAR,
      dscDetalAudit: `Alocação atualizada (motorista/fds/local/prioridade).`,
      indResultAudit: 'sucesso'
    });

    return res.json(aloc);
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar alocação.' });
  }
};

// POST /api/v1/beneficios/:id/encerrar
export const encerrarAlocacao = async (req, res) => {
  try {
    const { id } = req.params;
    const aloc = await Alocacao.findById(id).populate('idVeicAloc');
    if (!aloc) {
      return res.status(404).json({ erro: 'Alocação não encontrada.' });
    }

    // já encerrada?
    if (aloc.indStatAloc === 'encerrada') {
      return res.status(400).json({ erro: 'Alocação já está encerrada.' });
    }

    aloc.indStatAloc = 'encerrada';
    aloc.datFimAloc = new Date();
    aloc.datAtualAloc = new Date();
    await aloc.save();

    // liberar veículo
    if (aloc.idVeicAloc?._id) {
      const veic = await Veiculo.findById(aloc.idVeicAloc._id);
      if (veic) {
        veic.indStatVeic = 'disponivel';
        await veic.save();
      }
    }

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: aloc._id,
      dscTipoEntidAudit: 'Alocacao',
      dscAcaoAudit: AuditAction.ENCERRAR,
      dscDetalAudit: `Alocação do veículo encerrada.`,
      indResultAudit: 'sucesso'
    });

    return res.json(aloc);
  } catch (error) {
    console.error('Erro ao encerrar alocação:', error);
    return res.status(500).json({ erro: 'Erro ao encerrar alocação.' });
  }
};
