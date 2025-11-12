import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';
import Documento from '../models/Documento.js';

const router = Router();

// listar documentos
router.get('/', autenticar, autorizar('admin', 'gestor_frota'), async (req, res) => {
  try {
    const docs = await Documento.find().populate('idVeicDoc', 'dscModelVeic dscPlacaVeic');
    res.json(docs);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ erro: 'Erro ao listar documentos.' });
  }
});

// criar documento
router.post('/', autenticar, autorizar('admin', 'gestor_frota'), async (req, res) => {
  try {
    const doc = await Documento.create(req.body);
    res.status(201).json(doc);
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ erro: 'Erro ao criar documento.' });
  }
});

// deletar documento
router.delete('/:id', autenticar, autorizar('admin', 'gestor_frota'), async (req, res) => {
  try {
    const doc = await Documento.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' });
    res.json({ mensagem: 'Documento removido.' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ erro: 'Erro ao excluir documento.' });
  }
});

export default router;
