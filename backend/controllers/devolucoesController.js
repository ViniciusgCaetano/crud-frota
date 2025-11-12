import Devolucao from '../models/Devolucao.js';
import Reserva from '../models/Reserva.js';
import Veiculo from '../models/Veiculo.js';
import Auditoria from '../models/Auditoria.js';

const AuditAction = Object.freeze({
  DEVOLVER: 'DEVOLUCAO_REGISTRAR'
});

// Registrar devolução de veículo
export const registrarDevolucao = async (req, res) => {
  try {
    const { idReservaDevol } = req.body;

    const reserva = await Reserva.findById(idReservaDevol).populate('idVeicReserva');
    if (!reserva)
      return res.status(404).json({ erro: 'Reserva não encontrada.' });

    const devolucao = await Devolucao.create({
      ...req.body,
      idUsuarDevol: req.user.userId
    });

    // Atualiza reserva e veículo
    reserva.indStatReserva = 'concluida';
    await reserva.save();

    const veic = await Veiculo.findById(reserva.idVeicReserva._id);
    veic.indStatVeic = 'disponivel';
    await veic.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: devolucao._id,
      dscTipoEntidAudit: 'Devolucao',
      dscAcaoAudit: AuditAction.DEVOLVER,
      dscDetalAudit: `Veículo ${veic.dscModelVeic} devolvido.`,
      indResultAudit: 'sucesso'
    });

    res.status(201).json(devolucao);
  } catch (error) {
    console.error('Erro ao registrar devolução:', error);
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Devolucao',
      dscAcaoAudit: AuditAction.DEVOLVER,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    res.status(500).json({ erro: 'Erro ao registrar devolução.' });
  }
};

// Listar devoluções
export const getDevolucoes = async (req, res) => {
  try {
    const devolucoes = await Devolucao.find()
      .populate({
        path: 'idReservaDevol',
        populate: { path: 'idVeicReserva', select: 'dscModelVeic dscPlacaVeic' }
      })
      .populate('idUsuarDevol', 'nomUsuar dscEmailUsuar')
      .sort({ datCriDevol: -1 });

    res.json(devolucoes);
  } catch (error) {
    console.error('Erro ao listar devoluções:', error);
    res.status(500).json({ erro: 'Erro ao listar devoluções.' });
  }
};
