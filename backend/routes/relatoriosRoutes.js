// routes/relatoriosRoutes.js
import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';
import {
  getRelatorioUtilizacao,
  getRelatorioCustos,
  getRelatorioSLA,
  getCardsResumo,
  getTopVeiculos,
  getCustosPorTipo,
  getReservasPorDia,
  getReservasStatus,
  getVeiculosStatus,
} from '../controllers/relatoriosController.js';

const router = Router();

// todo relatório é coisa de gestão
const PERFIS_GESTAO = ['admin', 'gestor_frota'];

// 1. cards do topo (front esperava algo como /resumo)
router.get(
  '/cards-resumo',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getCardsResumo
);

// alias pra compatibilizar com o que o front antigo chamava
router.get(
  '/resumo',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getCardsResumo
);

// 2. utilização por veículo no mês
router.get(
  '/utilizacao',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getRelatorioUtilizacao
);

// 3. custos detalhados (por veículo e tipo) no período
router.get(
  '/custos',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getRelatorioCustos
);

// 4. SLA de aprovação
router.get(
  '/sla',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getRelatorioSLA
);

// 5. top veículos mais usados
router.get(
  '/top-veiculos',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getTopVeiculos
);

// 6. custos agregados por tipo (pra tabela de baixo / gráfico)
router.get(
  '/custos-por-tipo',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getCustosPorTipo
);

// 7. reservas por dia (pra linha)
router.get(
  '/reservas-por-dia',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getReservasPorDia
);

// 8. agregados simples
router.get(
  '/reservas-status',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getReservasStatus
);

router.get(
  '/veiculos-status',
  autenticar,
  autorizar(...PERFIS_GESTAO),
  getVeiculosStatus
);

export default router;
