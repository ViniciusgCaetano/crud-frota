// --- Configuração ---
const TOTAL_POR_COLECAO = 50;
const NUMERO_DE_BENEFICIOS = 20; // Quantos funcionários terão benefício de carro
// --------------------

// --- Dados de Teste (Mock Data) ---
const NOMES = ['Aline', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Fábio', 'Gabriela', 'Heitor', 'Isabela', 'João'];
const SOBRENOMES = ['Silva', 'Souza', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Almeida', 'Nunes', 'Marques', 'Ferreira'];
const CARGOS = ['Analista Jr.', 'Analista Pleno', 'Analista Sênior', 'Coordenador', 'Gerente de Projetos', 'Diretor', 'Vice-Presidente', 'Estagiário'];
const DEPARTAMENTOS = ['Financeiro', 'Engenharia', 'Recursos Humanos', 'Marketing', 'Vendas', 'Operações', 'Diretoria'];
const FABRICANTES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Nissan', 'BMW', 'Mercedes'];
const MODELOS = {
  'Toyota': ['Corolla', 'Hilux', 'Yaris'],
  'Honda': ['Civic', 'HR-V', 'Fit'],
  'Ford': ['Ka', 'Ranger', 'Mustang'],
  'Chevrolet': ['Onix', 'S10', 'Tracker'],
  'Volkswagen': ['Gol', 'Polo', 'T-Cross', 'Amarok'],
  'Fiat': ['Mobi', 'Argo', 'Toro', 'Strada'],
  'Hyundai': ['HB20', 'Creta'],
  'Nissan': ['Kicks', 'Frontier'],
  'BMW': ['Série 3', 'X1'],
  'Mercedes': ['Classe C', 'GLA']
};
const CORES = ['Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 'Azul'];
const COMBUSTIVEIS = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico'];
const PLACAS_LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOCAIS_EVENTO = ['Oficina ABC', 'Posto Shell', 'Garagem Central', 'Av. Paulista', 'Rod. Bandeirantes'];
const DESCRICOES_EVENTO = ['Troca de óleo', 'Revisão 20.000km', 'Abastecimento', 'Batida leve', 'Multa por radar'];
const SEGURADORAS = ['Porto Seguro', 'Azul Seguros', 'Allianz', 'Bradesco Seguros', 'Mapfre'];
const FINALIDADES_RESERVA = ['Visita a cliente', 'Viagem a filial', 'Evento corporativo', 'Transporte de material', 'Uso da diretoria'];
const DESTAQUES_LATARIA = ['bom', 'regular', 'arranhado', 'amassado'];

// --- Funções Auxiliares ---
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePlaca() {
  let l = () => getRandomItem(PLACAS_LETRAS);
  let n = () => getRandomInt(0, 9);
  return `${l()}${l()}${l()}-${n()}${l()}${n()}${n()}`; // Padrão Mercosul
}

// --- Funções de Geração de Documentos ---

function createRandomCarro() {
  const fabricante = getRandomItem(FABRICANTES);
  const modelo = getRandomItem(MODELOS[fabricante]);
  const ano = getRandomInt(2018, 2025);

  return {
    tipo: 'carro',
    fabricante: fabricante,
    modelo: modelo,
    cor: getRandomItem(CORES),
    placa: generatePlaca(),
    anoFabricacao: ano,
    tipoCombustivel: getRandomItem(COMBUSTIVEIS),
    qtdPortas: getRandomItem([2, 4]),
    opcionais: getRandomItem([['ar condicionado', 'airbag'], ['câmera de ré', 'teto solar'], ['GPS', 'banco de couro']]),
    documentos: [
      { tipo: 'renavam', numero: getRandomInt(100000000, 999999999).toString(), status: 'ativo' },
      { tipo: 'licenciamento', data: getRandomDate(new Date(ano + 1, 0, 1), new Date(2026, 11, 31)).toISOString().split('T')[0], status: 'regular' }
    ],
    seguro: {
      apolice: `BR-${getRandomInt(10000000, 99999999)}`,
      seguradora: getRandomItem(SEGURADORAS),
      validade: getRandomDate(new Date(2025, 0, 1), new Date(2027, 11, 31)).toISOString().split('T')[0],
      cobertura: ['roubo', 'colisão', 'terceiros']
    },
    estadoAtual: {
      km: getRandomInt(5000, 80000),
      nivelCombustivel: getRandomInt(10, 100),
      estadoLataria: 'bom',
      estadoPneus: 'regular',
      observacoes: ''
    },
    restricoes: {
      habilitacaoNecessaria: 'B'
    },
    eventos: [
      {
        tipo: getRandomItem(['manutencao', 'abastecimento', 'sinistro']),
        descricao: getRandomItem(DESCRICOES_EVENTO),
        data: getRandomDate(new Date(ano, 0, 1), new Date()).toISOString().split('T')[0],
        local: getRandomItem(LOCAIS_EVENTO),
        valor: getRandomInt(100, 1500),
        responsavel: `${getRandomItem(NOMES)} ${getRandomItem(SOBRENOMES)}`
      }
    ],
    alocacaoAtual: {
      tipo: null, // Será preenchido depois
      funcionarioId: null, // Será preenchido depois
    }
  };
}

function createRandomFuncionario() {
  return {
    nome: `${getRandomItem(NOMES)} ${getRandomItem(SOBRENOMES)}`,
    cargo: getRandomItem(CARGOS),
    departamento: getRandomItem(DEPARTAMENTOS),
    habilitacoes: getRandomItem([['B'], ['A', 'B'], ['B', 'D']]),
    supervisorId: null, // Pode ser preenchido depois se necessário
    beneficio: {
      possui: false,
      veiculoId: null,
      motoristaExclusivo: null,
      direitoFimDeSemana: getRandomItem([true, false]),
      estacionamentoDesignado: `Vaga ${getRandomInt(1, 100)}`
    }
  };
}

function createRandomReserva(allFuncIds, allCarIds) {
  const dataRetirada = getRandomDate(new Date(), new Date(2026, 11, 31));
  const dataDevolucaoPrevista = new Date(dataRetirada.getTime() + getRandomInt(1, 5) * 24 * 60 * 60 * 1000);
  const dataDevolucaoReal = new Date(dataDevolucaoPrevista.getTime() + getRandomInt(-2, 1) * 60 * 60 * 1000); // +/- horas
  const km = getRandomInt(50, 500);

  return {
    solicitanteId: getRandomItem(allFuncIds),
    supervisorAprovadorId: getRandomItem(allFuncIds),
    veiculoId: getRandomItem(allCarIds),
    dataRetirada: dataRetirada.toISOString(),
    dataDevolucaoPrevista: dataDevolucaoPrevista.toISOString(),
    destino: `Escritório ${getRandomItem(DEPARTAMENTOS)}`,
    finalidade: getRandomItem(FINALIDADES_RESERVA),
    kmEstimado: km,
    combustivelEstimado: Math.round(km / 10), // Assumindo 10km/l
    status: getRandomItem(['aprovada', 'concluída', 'pendente']),
    devolucao: {
      data: dataDevolucaoReal.toISOString(),
      kmFinal: getRandomInt(10000, 90000),
      combustivelRestante: getRandomInt(10, 100),
      estado: {
        lataria: getRandomItem(DESTAQUES_LATARIA),
        pneus: 'ok',
        motor: 'ok'
      },
      observacoes: 'Tudo certo',
      sugestoes: ''
    }
  };
}

// --- Função Principal de População ---

function popularBanco() {
  print("=================================================================");
  print(`Iniciando a população do banco de dados [${db.getName()}]`);
  print(`Total de ${TOTAL_POR_COLECAO} itens por coleção.`);
  print("=================================================================");

  // 1. Limpar coleções existentes (CUIDADO: APAGA TUDO)
  print("Limpando coleções antigas (carros, funcionarios, reservas)...");
  try {
    db.carros.drop();
    db.funcionarios.drop();
    db.reservas.drop();
    print("Coleções limpas com sucesso.");
  } catch (e) {
    print("Erro ao limpar coleções (pode ser a primeira execução):", e.message);
  }


  // 2. Gerar e Inserir Funcionários
  print(`\nGerando ${TOTAL_POR_COLECAO} funcionários...`);
  let funcionarios = [];
  for (let i = 0; i < TOTAL_POR_COLECAO; i++) {
    funcionarios.push(createRandomFuncionario());
  }
  let funcResult = db.funcionarios.insertMany(funcionarios);
  print(`Inseridos ${funcResult.insertedIds.length} funcionários.`);
  
  // 3. Gerar e Inserir Carros
  print(`\nGerando ${TOTAL_POR_COLECAO} carros...`);
  let carros = [];
  for (let i = 0; i < TOTAL_POR_COLECAO; i++) {
    carros.push(createRandomCarro());
  }
  let carResult = db.carros.insertMany(carros);
  print(`Inseridos ${carResult.insertedIds.length} carros.`);

  // 4. Pegar IDs reais do banco
  print("\nColetando IDs reais do banco para criar referências...");
  const allFuncIds = Object.values(funcResult.insertedIds);
  const allCarIds = Object.values(carResult.insertedIds);
  print(`Total de ${allFuncIds.length} IDs de funcionários e ${allCarIds.length} IDs de carros coletados.`);

  // 5. Gerar e Inserir Reservas (agora com IDs reais)
  print(`\nGerando ${TOTAL_POR_COLECAO} reservas...`);
  let reservas = [];
  for (let i = 0; i < TOTAL_POR_COLECAO; i++) {
    reservas.push(createRandomReserva(allFuncIds, allCarIds));
  }
  let resResult = db.reservas.insertMany(reservas);
  print(`Inseridas ${resResult.insertedIds.length} reservas.`);

  // 6. Ligar Benefícios (a parte mais complexa)
  print(`\nAtribuindo ${NUMERO_DE_BENEFICIOS} benefícios (ligando carros e funcionários)...`);
  
  // Garante que não peguemos os mesmos carros/funcionários para benefício
  let carIdsDisponiveis = [...allCarIds];
  let funcIdsDisponiveis = [...allFuncIds];
  let updates = [];
  
  for (let i = 0; i < NUMERO_DE_BENEFICIOS; i++) {
    if (carIdsDisponiveis.length === 0 || funcIdsDisponiveis.length === 0) {
      print("Não há mais carros ou funcionários disponíveis para benefício.");
      break;
    }

    // Pega um ID aleatório e o remove da lista de disponíveis
    let carId = carIdsDisponiveis.splice(getRandomInt(0, carIdsDisponiveis.length - 1), 1)[0];
    let funcId = funcIdsDisponiveis.splice(getRandomInt(0, funcIdsDisponiveis.length - 1), 1)[0];

    // Prepara a atualização no funcionário
    updates.push({
      updateOne: {
        filter: { _id: funcId },
        update: {
          $set: {
            "beneficio.possui": true,
            "beneficio.veiculoId": carId,
            "beneficio.direitoFimDeSemana": getRandomItem([true, false])
          }
        }
      }
    });

    // Prepara a atualização no carro
    updates.push({
      updateOne: {
        filter: { _id: carId },
        update: {
          $set: {
            "alocacaoAtual.tipo": "beneficio",
            "alocacaoAtual.funcionarioId": funcId
          }
        }
      }
    });
  }

  // Executa as atualizações em lote (Bulk Write)
  if (updates.length > 0) {
    db.funcionarios.bulkWrite(updates.filter(u => u.updateOne.filter._id.toString().length > 0)); // Filtra só updates de funcionarios
    db.carros.bulkWrite(updates.filter(u => u.updateOne.filter._id.toString().length > 0)); // Filtra só updates de carros
    print(`Foram feitas ${updates.length / 2} ligações de benefício.`);
  }

  print("População do banco de dados concluída com sucesso!");
}

// --- Executa a função principal ---
popularBanco();