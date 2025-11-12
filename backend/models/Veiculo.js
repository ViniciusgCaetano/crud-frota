import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema(
  {
    dscFabricVeic: { type: String, required: true },
    dscModelVeic: { type: String, required: true },

    // novo: tipo do veículo (carro, moto, van, trator, barco...)
    dscTipoVeic: {
      type: String,
      enum: ['carro', 'moto', 'van', 'triciclo', 'trator', 'barco', 'aviao_pequeno', 'outro'],
      default: 'carro'
    },

    dscCorVeic: { type: String },

    // se você quiser permitir veículo sem placa (barco, trator), pode tirar o required daqui
    dscPlacaVeic: { type: String, required: true, unique: true },

    dscCombustVeic: {
      type: String,
      enum: ['gasolina', 'etanol', 'diesel', 'elétrico', 'híbrido'],
      required: true
    },

    qtdPortaVeic: { type: Number },

    // lista de opcionais
    dscOpcionVeic: [{ type: String }],

    // restrições de uso (rodízio, só fim de semana, só para diretoria...)
    dscRestrVeic: { type: String },

    // habilitação necessária
    dscTipoHabVeic: { type: String },

    indStatVeic: {
      type: String,
      enum: ['disponivel', 'reservado', 'em_manutencao', 'indisponivel'],
      default: 'disponivel'
    },

    datCriVeic: { type: Date, default: Date.now },
    datAtualVeic: { type: Date, default: Date.now }
  },
  { collection: 'Veiculo' }
);

// índice pra placa
veiculoSchema.index({ dscPlacaVeic: 1 });

export default mongoose.model('Veiculo', veiculoSchema, 'Veiculo');
