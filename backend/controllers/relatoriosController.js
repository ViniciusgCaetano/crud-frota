// controllers/relatoriosController.js
import Reserva from '../models/Reserva.js';
import Evento from '../models/Evento.js';
import Veiculo from '../models/Veiculo.js';
import Devolucao from '../models/Devolucao.js';
import Auditoria from '../models/Auditoria.js';
import Alocacao from '../models/Alocacao.js';

// helper: dado "2025-11" devolve {ini: '2025-11-01', fim: '2025-11-30'}
function getInicioFimDoMes(anoMes) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

/**
 * GET /api/v1/relatorios/utilizacao?ano_mes=YYYY-MM
 */
export const getRelatorioUtilizacao = async (req, res) => {
  try {
    const { ano_mes } = req.query;
    if (!ano_mes || !/^\d{4}-\d{2}$/.test(ano_mes)) {
      return res
        .status(400)
        .json({ erro: 'Parâmetro ano_mes é obrigatório no formato YYYY-MM' });
    }

    const { inicio, fim } = getInicioFimDoMes(ano_mes);

    const utilizacao = await Reserva.aggregate([
      { $match: { indStatReserva: 'concluida' } },
      {
        $lookup: {
          from: 'Devolucao',
          let: { resId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$idReservaDevol', '$$resId'] },
                datDevol: { $gte: inicio, $lte: fim },
              },
            },
          ],
          as: 'devol',
        },
      },
      { $unwind: '$devol' },
      {
        // garante que não vire negativo
        $addFields: {
          durMsRaw: { $subtract: ['$devol.datDevol', '$datUsoReserva'] },
        },
      },
      {
        $addFields: {
          durMs: {
            $cond: [
              { $lt: ['$durMsRaw', 0] },
              0,
              '$durMsRaw',
            ],
          },
        },
      },
      {
        $group: {
          _id: '$idVeicReserva',
          totalMs: { $sum: '$durMs' },
          countReservas: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'Veiculo',
          localField: '_id',
          foreignField: '_id',
          as: 'veiculo',
        },
      },
      { $unwind: '$veiculo' },
      {
        $project: {
          _id: 0,
          veiculoId: '$veiculo._id',
          fabricante: '$veiculo.dscFabricVeic',
          modelo: '$veiculo.dscModelVeic',
          placa: '$veiculo.dscPlacaVeic',
          totalHoras: {
            $round: [{ $divide: ['$totalMs', 1000 * 60 * 60] }, 2],
          },
          totalDias: {
            $round: [{ $divide: ['$totalMs', 1000 * 60 * 60 * 24] }, 2],
          },
          countReservas: 1,
        },
      },
      { $sort: { totalHoras: -1 } },
    ]);

    return res.json(utilizacao);
  } catch (error) {
    console.error('Erro ao gerar relatório de utilização:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/custos?ini=YYYY-MM-DD&fim=YYYY-MM-DD
 */
export const getRelatorioCustos = async (req, res) => {
  try {
    let { ini, fim, ano_mes } = req.query;

    // se vier só o mês, converte
    if (!ini && !fim && ano_mes) {
      const { inicio, fim: fimMes } = getInicioFimDoMes(ano_mes);
      ini = inicio.toISOString().slice(0, 10);
      fim = fimMes.toISOString().slice(0, 10);
    }

    if (!ini || !fim) {
      return res
        .status(400)
        .json({ erro: 'Parâmetros ini e fim são obrigatórios (YYYY-MM-DD)' });
    }

    const dataIni = new Date(ini);
    const dataFim = new Date(fim);

    const custos = await Evento.aggregate([
      {
        $match: {
          datEvent: { $gte: dataIni, $lte: dataFim },
          valEvent: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: { tipo: '$dscTipoEvent', veiculo: '$idVeicEvent' },
          totalValor: { $sum: '$valEvent' },
          countEventos: { $sum: 1 },
          mediaValor: { $avg: '$valEvent' },
        },
      },
      {
        $lookup: {
          from: 'Veiculo',
          localField: '_id.veiculo',
          foreignField: '_id',
          as: 'veiculo',
        },
      },
      { $unwind: { path: '$veiculo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          tipo: '$_id.tipo',
          veiculoId: '$veiculo._id',
          fabricante: '$veiculo.dscFabricVeic',
          modelo: '$veiculo.dscModelVeic',
          placa: '$veiculo.dscPlacaVeic',
          totalValor: 1,
          countEventos: 1,
          mediaValor: { $round: ['$mediaValor', 2] },
        },
      },
      { $sort: { totalValor: -1 } },
    ]);

    return res.json(custos);
  } catch (error) {
    console.error('Erro ao gerar relatório de custos:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/sla?ini=...&fim=...
 */
export const getRelatorioSLA = async (req, res) => {
  try {
    let { ini, fim, ano_mes } = req.query;

    if (!ini && !fim && ano_mes) {
      const { inicio, fim: fimMes } = getInicioFimDoMes(ano_mes);
      ini = inicio.toISOString().slice(0, 10);
      fim = fimMes.toISOString().slice(0, 10);
    }

    if (!ini || !fim) {
      return res
        .status(400)
        .json({ erro: 'Parâmetros ini e fim são obrigatórios (YYYY-MM-DD)' });
    }

    const dataIni = new Date(ini);
    const dataFim = new Date(fim);

    const slaAgg = await Auditoria.aggregate([
      {
        $match: {
          dscAcaoAudit: 'RESERVA_APROVAR',
          datCriAudit: { $gte: dataIni, $lte: dataFim },
        },
      },
      {
        $lookup: {
          from: 'Reserva',
          localField: 'idEntidAudit',
          foreignField: '_id',
          as: 'reserva',
        },
      },
      { $unwind: '$reserva' },
      {
        $project: {
          tempoHoras: {
            $divide: [
              { $subtract: ['$datCriAudit', '$reserva.datCriReserva'] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          tempoMedio: { $avg: '$tempoHoras' },
          tempoMinimo: { $min: '$tempoHoras' },
          tempoMaximo: { $max: '$tempoHoras' },
          totalReservas: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          tempoMedioHoras: { $round: ['$tempoMedio', 2] },
          tempoMinimoHoras: { $round: ['$tempoMinimo', 2] },
          tempoMaximoHoras: { $round: ['$tempoMaximo', 2] },
          totalReservas: 1,
        },
      },
    ]);

    return res.json(
      slaAgg[0] || {
        tempoMedioHoras: 0,
        tempoMinimoHoras: 0,
        tempoMaximoHoras: 0,
        totalReservas: 0,
      }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório de SLA:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/cards-resumo?ano_mes=YYYY-MM
 */
export const getCardsResumo = async (req, res) => {
  try {
    const { ano_mes, ini, fim } = req.query;

    let dataIni = null;
    let dataFim = null;
    if (ano_mes && /^\d{4}-\d{2}$/.test(ano_mes)) {
      const range = getInicioFimDoMes(ano_mes);
      dataIni = range.inicio;
      dataFim = range.fim;
    } else if (ini && fim) {
      dataIni = new Date(ini);
      dataFim = new Date(fim);
    }

    const [veicTot, veicDisp, resPend, alocAtivas, custos] = await Promise.all([
      Veiculo.countDocuments(),
      Veiculo.countDocuments({ indStatVeic: 'disponivel' }),
      Reserva.countDocuments({ indStatReserva: 'pendente' }),
      Alocacao.countDocuments({ indStatAloc: 'ativa' }),
      Evento.aggregate([
        {
          $match:
            dataIni && dataFim
              ? {
                  datEvent: { $gte: dataIni, $lte: dataFim },
                  valEvent: { $gt: 0 },
                }
              : { valEvent: { $gt: 0 } },
        },
        { $group: { _id: null, total: { $sum: '$valEvent' } } },
      ]),
    ]);

    res.json({
      totalVeiculos: veicTot,
      veiculosDisponiveis: veicDisp,
      reservasPendentes: resPend,
      alocacoesAtivas: alocAtivas,
      custoPeriodo: custos[0]?.total || 0,
    });
  } catch (error) {
    console.error('Erro ao gerar cards de resumo:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/top-veiculos?ano_mes=YYYY-MM&limite=5
 */
export const getTopVeiculos = async (req, res) => {
  try {
    const { ano_mes, limite = 5 } = req.query;
    if (!ano_mes || !/^\d{4}-\d{2}$/.test(ano_mes)) {
      return res
        .status(400)
        .json({ erro: 'Parâmetro ano_mes é obrigatório no formato YYYY-MM' });
    }

    const { inicio, fim } = getInicioFimDoMes(ano_mes);

    const lista = await Reserva.aggregate([
      { $match: { indStatReserva: 'concluida' } },
      {
        $lookup: {
          from: 'Devolucao',
          let: { resId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$idReservaDevol', '$$resId'] },
                datDevol: { $gte: inicio, $lte: fim },
              },
            },
          ],
          as: 'devol',
        },
      },
      { $unwind: '$devol' },
      {
        $addFields: {
          durMsRaw: { $subtract: ['$devol.datDevol', '$datUsoReserva'] },
        },
      },
      {
        $addFields: {
          durMs: {
            $cond: [{ $lt: ['$durMsRaw', 0] }, 0, '$durMsRaw'],
          },
        },
      },
      {
        $group: {
          _id: '$idVeicReserva',
          totalMs: { $sum: '$durMs' },
        },
      },
      {
        $lookup: {
          from: 'Veiculo',
          localField: '_id',
          foreignField: '_id',
          as: 'veiculo',
        },
      },
      { $unwind: '$veiculo' },
      {
        $project: {
          _id: 0,
          veiculoId: '$veiculo._id',
          modelo: '$veiculo.dscModelVeic',
          placa: '$veiculo.dscPlacaVeic',
          totalHoras: {
            $round: [{ $divide: ['$totalMs', 1000 * 60 * 60] }, 2],
          },
        },
      },
      { $sort: { totalHoras: -1 } },
      { $limit: Number(limite) },
    ]);

    res.json(lista);
  } catch (error) {
    console.error('Erro ao gerar top de veículos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/custos-por-tipo?ini=...&fim=...
 */
export const getCustosPorTipo = async (req, res) => {
  try {
    let { ini, fim, ano_mes } = req.query;
    if (!ini && !fim && ano_mes) {
      const { inicio, fim: ff } = getInicioFimDoMes(ano_mes);
      ini = inicio.toISOString().slice(0, 10);
      fim = ff.toISOString().slice(0, 10);
    }
    if (!ini || !fim) {
      return res
        .status(400)
        .json({ erro: 'Parâmetros ini e fim são obrigatórios' });
    }

    const dataIni = new Date(ini);
    const dataFim = new Date(fim);

    const agg = await Evento.aggregate([
      {
        $match: {
          datEvent: { $gte: dataIni, $lte: dataFim },
          valEvent: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$dscTipoEvent',
          total: { $sum: '$valEvent' },
          eventos: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          tipo: '$_id',
          total: 1,
          eventos: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(agg);
  } catch (error) {
    console.error('Erro ao gerar custos por tipo:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/reservas-por-dia?ini=...&fim=...
 */
export const getReservasPorDia = async (req, res) => {
  try {
    let { ini, fim, ano_mes } = req.query;
    if (!ini && !fim && ano_mes) {
      const { inicio, fim: ff } = getInicioFimDoMes(ano_mes);
      ini = inicio.toISOString();
      fim = ff.toISOString();
    }
    if (!ini || !fim) {
      return res
        .status(400)
        .json({ erro: 'Parâmetros ini e fim são obrigatórios' });
    }

    const dataIni = new Date(ini);
    const dataFim = new Date(fim);

    const agg = await Reserva.aggregate([
      {
        $match: {
          datCriReserva: { $gte: dataIni, $lte: dataFim },
        },
      },
      {
        $group: {
          _id: {
            ano: { $year: '$datCriReserva' },
            mes: { $month: '$datCriReserva' },
            dia: { $dayOfMonth: '$datCriReserva' },
          },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          dia: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.ano',
                  month: '$_id.mes',
                  day: '$_id.dia',
                },
              },
            },
          },
          total: 1,
        },
      },
      { $sort: { dia: 1 } },
    ]);

    res.json(agg);
  } catch (error) {
    console.error('Erro ao gerar reservas por dia:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/v1/relatorios/reservas-status
 */
export const getReservasStatus = async (_req, res) => {
  try {
    const agg = await Reserva.aggregate([
      { $group: { _id: '$indStatReserva', total: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          status: '$_id',
          total: 1,
        },
      },
      { $sort: { status: 1 } },
    ]);
    res.json(agg);
  } catch (error) {
    console.error('Erro ao gerar relatório de reservas por status:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
};

/**
 * GET /api/v1/relatorios/veiculos-status
 */
export const getVeiculosStatus = async (_req, res) => {
  try {
    const agg = await Veiculo.aggregate([
      { $group: { _id: '$indStatVeic', total: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          status: '$_id',
          total: 1,
        },
      },
      { $sort: { status: 1 } },
    ]);
    res.json(agg);
  } catch (error) {
    console.error('Erro ao gerar relatório de veículos por status:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
};
