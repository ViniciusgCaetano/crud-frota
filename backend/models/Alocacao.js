import mongoose from 'mongoose';

const alocacaoSchema = new mongoose.Schema({
  idUsuarAloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  idVeicAloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  idMotExclAloc: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  indFdsAloc: { type: Boolean, default: false },
  dscLocalEstacAloc: { type: String },
  datInicioAloc: { type: Date, required: true },
  datFimAloc: { type: Date },
  numPriorAloc: { type: Number, default: 0 },
  indStatAloc: { type: String, enum: ['ativa', 'encerrada'], default: 'ativa' },
  datCriAloc: { type: Date, default: Date.now },
  datAtualAloc: { type: Date, default: Date.now },
  dscJustfAloc: { type: String }
}, { collection: 'Alocacao' });

alocacaoSchema.index({ idUsuarAloc: 1, idVeicAloc: 1 });
export default mongoose.model('Alocacao', alocacaoSchema, 'Alocacao');
