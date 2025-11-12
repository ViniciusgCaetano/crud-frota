import Veiculo from '../models/Veiculo.js';
import Auditoria from '../models/Auditoria.js';

const AuditAction = Object.freeze({
  CRIAR: 'VEICULO_CRIAR',
  ATUALIZAR: 'VEICULO_ATUALIZAR',
  EXCLUIR: 'VEICULO_EXCLUIR'
});

// Criar veículo
export const createVeiculo = async (req, res) => {
  try {
    const veic = await Veiculo.create(req.body);

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: veic._id,
      dscTipoEntidAudit: 'Veiculo',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: `Veículo ${veic.dscModelVeic} criado.`,
      indResultAudit: 'sucesso'
    });

    res.status(201).json(veic);
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Veiculo',
      dscAcaoAudit: AuditAction.CRIAR,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    res.status(500).json({ erro: 'Erro ao criar veículo.' });
  }
};

// Listar veículos
export const getVeiculos = async (req, res) => {
  try {
    const veiculos = await Veiculo.find().sort({ datCriVeic: -1 });
    res.json(veiculos);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ erro: 'Erro ao listar veículos.' });
  }
};

// Obter veículo por ID
export const getVeiculoById = async (req, res) => {
  try {
    const veiculo = await Veiculo.findById(req.params.id);
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });
    res.json(veiculo);
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ erro: 'Erro ao buscar veículo.' });
  }
};

// Atualizar veículo
export const updateVeiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const veiculo = await Veiculo.findByIdAndUpdate(id, req.body, { new: true });
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: veiculo._id,
      dscTipoEntidAudit: 'Veiculo',
      dscAcaoAudit: AuditAction.ATUALIZAR,
      dscDetalAudit: `Veículo ${veiculo.dscModelVeic} atualizado.`,
      indResultAudit: 'sucesso'
    });

    res.json(veiculo);
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    await Auditoria.create({
      idUsuarAudit: req.user?.userId,
      dscTipoEntidAudit: 'Veiculo',
      dscAcaoAudit: AuditAction.ATUALIZAR,
      dscDetalAudit: error.message,
      indResultAudit: 'erro'
    });
    res.status(500).json({ erro: 'Erro ao atualizar veículo.' });
  }
};

// Excluir veículo
export const deleteVeiculo = async (req, res) => {
  try {
    const veiculo = await Veiculo.findByIdAndDelete(req.params.id);
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });

    await Auditoria.create({
      idUsuarAudit: req.user.userId,
      idEntidAudit: veiculo._id,
      dscTipoEntidAudit: 'Veiculo',
      dscAcaoAudit: AuditAction.EXCLUIR,
      dscDetalAudit: `Veículo ${veiculo.dscModelVeic} excluído.`,
      indResultAudit: 'sucesso'
    });

    res.json({ mensagem: 'Veículo removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    res.status(500).json({ erro: 'Erro ao excluir veículo.' });
  }
};
