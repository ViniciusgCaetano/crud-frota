import mongoose from 'mongoose';

const eventoSchema = new mongoose.Schema({
  idVeicEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  idUsuarEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },

  dscTipoEvent: {
    type: String,
    enum: ['manutencao', 'revisao', 'lavagem', 'troca_pneus', 'conserto', 'batida', 'guincho', 'roubo', 'inspecao', 'lacracao', 'licenciamento'],
    required: true
  },
  datEvent: { type: Date, required: true },
  dscLocalEvent: { type: String },
  valEvent: { type: Number },
  dscDetalEvent: { type: String },
  dscComprovEvent: { type: String }, // path do arquivo

  // Endereço completo
  dscTipoLogrEvent: { type: String },
  dscNomeLogrEvent: { type: String },
  numLogrEvent: { type: String },
  dscBairroEvent: { type: String },
  dscCidadeEvent: { type: String },
  dscEstadoEvent: { type: String },
  numCepEvent: { type: String },

  datCriEvent: { type: Date, default: Date.now }
}, { collection: 'Evento' });

eventoSchema.index({ idVeicEvent: 1, dscTipoEvent: 1 });
export default mongoose.model('Evento', eventoSchema, 'Evento');
