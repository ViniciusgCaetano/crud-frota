import mongoose from 'mongoose';

const auditoriaSchema = new mongoose.Schema({
  idUsuarAudit: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  idEntidAudit: { type: mongoose.Schema.Types.ObjectId, required: true },
  dscTipoEntidAudit: { type: String, required: true },
  dscAcaoAudit: {
    type: String,
    enum: [
      'USUARIO_CRIAR', 'USUARIO_ATUALIZAR', 'USUARIO_EXCLUIR',
      'VEICULO_CRIAR', 'VEICULO_ATUALIZAR', 'VEICULO_EXCLUIR',
      'RESERVA_CRIAR', 'RESERVA_APROVAR', 'RESERVA_REJEITAR', 'RESERVA_CANCELAR',
      'DEVOLUCAO_REGISTRAR',
      'EVENTO_REGISTRAR', 'USUARIO_LOGIN', 'ATUALIZACAO_USUARIO', `ALOCACAO_CRIAR`, 'ALOCACAO_ENCERRAR'
    ],
    required: true
  },
  dscDetalAudit: { type: String },
  indResultAudit: { type: String, enum: ['sucesso', 'erro'], default: 'sucesso' },
  datCriAudit: { type: Date, default: Date.now }
}, { collection: 'Auditoria' });

auditoriaSchema.index({ dscTipoEntidAudit: 1, dscAcaoAudit: 1 });
export default mongoose.model('Auditoria', auditoriaSchema, 'Auditoria');
