import { Router } from 'express';
import {
  createVeiculo,
  getVeiculos,
  getVeiculoById,
  updateVeiculo,
  deleteVeiculo
} from '../controllers/veiculosController.js';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';

const router = Router();

// listar veículos (todo mundo logado)
router.get('/', autenticar, getVeiculos);

// pegar veículo
router.get('/:id', autenticar, getVeiculoById);

// criar veículo (gestor de frota ou admin)
router.post('/', autenticar, autorizar('gestor_frota', 'admin'), createVeiculo);

// atualizar veículo
router.put('/:id', autenticar, autorizar('gestor_frota', 'admin'), updateVeiculo);

// excluir
router.delete('/:id', autenticar, autorizar('admin'), deleteVeiculo);

export default router;
