import Evento from '../models/Evento.js';
import Veiculo from '../models/Veiculo.js';
import Auditoria from '../models/Auditoria.js';

const AuditAction = Object.freeze({
  REGISTRAR: 'EVENTO_REGISTRAR'
});

// Registrar evento de manutenção / incidente / etc.
export const registrarEvento = async (req, res) => {
  try {
    const { idVeicEvent, dscTipoEvent } = req.body;

    const veic = await Veiculo.findById(idVeicEvent);
    if (!veic) return res.status(404).json({ erro: 'Veículo não encontrado.' });

    const evento = await Evento.create({
      ...req.body,
      idUsuarEvent: req.user.userId
    });

    // Atualiza status do veículo conforme o tipo do evento
    if (['manutencao', 'revisao', 'conserto'].includes(dscTipoEvent)) {
      veic.indStatVeic = 'em_manutencao';
    }
    if (['roubo', 'batida'].includes(dscTipoEvent)) {
      veic.indStatVeic = 'indisponivel';
    }
    await veic.save();

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: evento._id,
      dscTipoEntidAudit: 'Evento',
      dscAcaoAudit: AuditAction.REGISTRAR,
      dscDetalAudit: `Evento (${dscTipoEvent}) registrado para veículo ${veic.dscModelVeic}.`,
      indResultAudit: 'sucesso'
    });

    res.status(201).json(evento);
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Evento',
      dscAcaoAudit: AuditAction.REGISTRAR,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    res.status(500).json({ erro: 'Erro ao registrar evento.' });
  }
};

// Listar eventos
export const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.find()
      .populate('idVeicEvent', 'dscModelVeic dscPlacaVeic')
      .populate('idUsuarEvent', 'nomUsuar dscEmailUsuar')
      .sort({ datEvent: -1 });

    res.json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ erro: 'Erro ao listar eventos.' });
  }
};

// Buscar evento por ID
export const getEventoById = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
      .populate('idVeicEvent', 'dscModelVeic dscPlacaVeic')
      .populate('idUsuarEvent', 'nomUsuar dscEmailUsuar');

    if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });

    res.json(evento);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ erro: 'Erro ao buscar evento.' });
  }
};
