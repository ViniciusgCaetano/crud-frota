import Reserva from '../models/Reserva.js';
import Auditoria from '../models/Auditoria.js';
import Veiculo from '../models/Veiculo.js';
import Usuario from '../models/Usuario.js';

const AuditAction = Object.freeze({
  CRIAR: 'RESERVA_CRIAR',
  APROVAR: 'RESERVA_APROVAR',
  REJEITAR: 'RESERVA_REJEITAR',
  CANCELAR: 'RESERVA_CANCELAR',
  EXCLUIR: 'RESERVA_EXCLUIR'
});

// Criar reserva
export const createReserva = async (req, res) => {
  try {
    const { idVeicReserva } = req.body;

    const veic = await Veiculo.findById(idVeicReserva);
    if (!veic) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (veic.indStatVeic !== 'disponivel') {
      return res.status(400).json({ erro: 'Veículo indisponível para reserva.' });
    }

    const reserva = await Reserva.create({
      ...req.body,
      idSolicitUsuar: req.body.idSolicitUsuar || req.user.userId,
      indStatReserva: 'pendente'
    });

    veic.indStatVeic = 'reservado';
    await veic.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: reserva._id,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: `Reserva criada para o veículo ${veic.dscModelVeic}.`,
      indResultAudit: 'sucesso'
    });

    return res.status(201).json(reserva);
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    return res.status(500).json({ erro: 'Erro ao criar reserva.' });
  }
};

// Listar reservas
export const getReservas = async (req, res) => {
  try {
    const reservas = await Reserva.find()
      .populate('idVeicReserva', 'dscModelVeic dscPlacaVeic')
      .populate('idSolicitUsuar', 'nomUsuar dscEmailUsuar')
      .populate('idSupervAprov', 'nomUsuar dscEmailUsuar')
      .sort({ datCriReserva: -1 });

    return res.json(reservas);
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    return res.status(500).json({ erro: 'Erro ao listar reservas.' });
  }
};

// Aprovar reserva
export const aprovarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findById(id).populate('idVeicReserva');
    if (!reserva) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    reserva.indStatReserva = 'aprovada';
    reserva.idSupervAprov = req.user.userId;
    await reserva.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: reserva._id,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.APROVAR,
      dscDetalAudit: `Reserva do veículo ${reserva.idVeicReserva.dscModelVeic} aprovada.`,
      indResultAudit: 'sucesso'
    });

    return res.json(reserva);
  } catch (error) {
    console.error('Erro ao aprovar reserva:', error);
    return res.status(500).json({ erro: 'Erro ao aprovar reserva.' });
  }
};

// Rejeitar reserva
export const rejeitarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findById(id).populate('idVeicReserva');
    if (!reserva) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    reserva.indStatReserva = 'rejeitada';
    reserva.idSupervAprov = req.user.userId;
    await reserva.save();

    // libera o veículo
    const veic = await Veiculo.findById(reserva.idVeicReserva._id);
    if (veic) {
      veic.indStatVeic = 'disponivel';
      await veic.save();
    }

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: reserva._id,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.REJEITAR,
      dscDetalAudit: `Reserva rejeitada para veículo ${veic?.dscModelVeic || ''}.`,
      indResultAudit: 'sucesso'
    });

    return res.json(reserva);
  } catch (error) {
    console.error('Erro ao rejeitar reserva:', error);
    return res.status(500).json({ erro: 'Erro ao rejeitar reserva.' });
  }
};

// Cancelar reserva (AGORA deletando)
export const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await Reserva.findById(id).populate('idVeicReserva');
    if (!reserva) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    // regra opcional: só quem criou ou quem é admin/supervisor pode cancelar
    if (
      reserva.idSolicitUsuar?.toString() !== req.user.userId &&
      !['admin', 'gestor_frota', 'supervisor'].includes(req.user.indPerfUsuar)
    ) {
      return res.status(403).json({ erro: 'Você não pode cancelar esta reserva.' });
    }

    // libera o veículo
    if (reserva.idVeicReserva?._id) {
      const veic = await Veiculo.findById(reserva.idVeicReserva._id);
      if (veic) {
        veic.indStatVeic = 'disponivel';
        await veic.save();
      }
    }

    // audita antes de apagar
    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: reserva._id,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.CANCELAR,
      dscDetalAudit: `Reserva cancelada e removida do banco.`,
      indResultAudit: 'sucesso'
    });

    // remove a reserva do banco
    await Reserva.deleteOne({ _id: id });

    return res.json({ mensagem: 'Reserva cancelada e excluída.' });
  } catch (error) {
    console.error('Erro ao cancelar/excluir reserva:', error);
    return res.status(500).json({ erro: 'Erro ao cancelar/excluir reserva.' });
  }
};

// DELETE direto (pra usar com DELETE /reservas/:id)
export const deleteReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findById(id).populate('idVeicReserva');

    if (!reserva) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    // solta o veículo
    if (reserva.idVeicReserva?._id) {
      const veic = await Veiculo.findById(reserva.idVeicReserva._id);
      if (veic) {
        veic.indStatVeic = 'disponivel';
        await veic.save();
      }
    }

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: reserva._id,
      dscTipoEntidAudit: 'Reserva',
      dscAcaoAudit: AuditAction.EXCLUIR,
      dscDetalAudit: `Reserva excluída via DELETE.`,
      indResultAudit: 'sucesso'
    });

    await Reserva.deleteOne({ _id: id });

    return res.json({ mensagem: 'Reserva excluída.' });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    return res.status(500).json({ erro: 'Erro ao excluir reserva.' });
  }
};
