import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const usuarioSchema = new mongoose.Schema({
  nomUsuar: { type: String, required: true },
  dscEmailUsuar: { type: String, required: true, unique: true, index: true },
  dscSenhaUsuar: { type: String, required: true },
  numTelUsuar: { type: String },
  dscCargoUsuar: { type: String },

  indPerfUsuar: {
    type: String,
    enum: ['solicitante', 'supervisor', 'gestor_frota', 'admin'],
    default: 'solicitante'
  },
  indStatUsuar: {
    type: String,
    enum: ['ativo', 'inativo', 'bloqueado'],
    default: 'ativo'
  },

  idSupervUsuar: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },

  datCriUsuar: { type: Date, default: Date.now },
  datAtualUsuar: { type: Date, default: Date.now }
}, { collection: 'Usuario' });

usuarioSchema.index({ indPerfUsuar: 1, indStatUsuar: 1 });
usuarioSchema.plugin(mongoosePaginate);

export default mongoose.model('Usuario', usuarioSchema, 'Usuario');
