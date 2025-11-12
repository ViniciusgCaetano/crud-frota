import React, { useEffect, useState } from "react";
import './styles.css'
// ============================
// CONFIG HARD-CODED
// ============================
const API_BASE = "http://localhost:3000/api/v1";
const API_KEY = "dev-key-local"; 

async function baseFetch(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erro || data.message || "Erro na requisição");
  }
  return data;
}

function App() {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [globalError, setGlobalError] = useState("");

  // listas globais (para dropdown)
  const [usuariosList, setUsuariosList] = useState([]);
  const [veiculosList, setVeiculosList] = useState([]);
  const [reservasList, setReservasList] = useState([]);

  // ============================
  // LOGIN
  // ============================
async function handleLogin(email, senha) {
  setGlobalError("");
  try {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ email, senha }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.erro || "Falha no login");
    }

    setToken(data.token);
    setCurrentUser(data.usuario);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.usuario));
  } catch (err) {
    setGlobalError(err.message);
  }
}

// opcional: seed admin
async function handleSeedAdmin() {
  try {
    const resp = await fetch(`${API_BASE}/auth/seed-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.erro || "Falha ao criar admin");
    }
    setGlobalError("Admin criado. Faça login.");
  } catch (err) {
    setGlobalError(err.message);
  }
}


  async function refreshSharedLists() {
    if (!token) return;
    try {
      const [users, veics, resvs] = await Promise.all([
        baseFetch("/usuarios?limit=200", {}, token).catch(() => ({
          usuarios: [],
        })),
        baseFetch("/veiculos", {}, token).catch(() => []),
        baseFetch("/reservas", {}, token).catch(() => []),
      ]);
      setUsuariosList(users.usuarios || []);
      setVeiculosList(veics || []);
      setReservasList(resvs || []);
    } catch (e) {
      console.warn("Erro ao carregar listas globais:", e.message);
    }
  }

  useEffect(() => {
    refreshSharedLists();
  }, [token]);


function LoginScreen({
  handleLogin,
  handleSeedAdmin,
  globalError,
  API_BASE,
}) {
  const [email, setEmail] = useState("admin@empresa.com");
  const [senha, setSenha] = useState("admin123");

  return (
    <div className="login-wrapper">
      <div className="card login-card">
        <h2>Login</h2>
        <p className="muted small">
          API: {API_BASE} | chave: hardcoded no front
        </p>

        <label>E-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button onClick={() => handleLogin(email, senha)}>Entrar</button>

        <button className="ghost" onClick={handleSeedAdmin}>
          Criar admin (seed)
        </button>

        {globalError && <p className="error-text">{globalError}</p>}
      </div>
    </div>
  );
}

function Dashboard({ baseFetch, token, currentUser }) {
  const [cards, setCards] = React.useState(null);
  const [erro, setErro] = React.useState("");

  React.useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await baseFetch("/relatorios/cards-resumo", {}, token);
        setCards(data);
        setErro("");
      } catch (e) {
        // se a rota estiver protegida só pra admin/gestor, mostra o aviso
        setErro(
          "Não foi possível carregar os indicadores. Verifique se o usuário tem permissão ou se a rota existe."
        );
      }
    })();
  }, [token]);

  return (
    <div>
      <h2>Visão geral</h2>
      <p className="muted">
        Usuário:{" "}
        <strong>{currentUser?.nomUsuar || currentUser?.dscEmailUsuar}</strong>{" "}
        ({currentUser?.indPerfUsuar || "sem perfil"})
      </p>

      {erro && <p className="error-text">{erro}</p>}

      {/* cards de topo */}
      <div className="dash-cards-grid">
        <div className="dash-card">
          <p className="dash-card-title">Veículos</p>
          <p className="dash-card-value">{cards?.totalVeiculos ?? "—"}</p>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Disponíveis</p>
          <p className="dash-card-value dash-card-ok">
            {cards?.veiculosDisponiveis ?? "—"}
          </p>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Reservas pendentes</p>
          <p className="dash-card-value dash-card-warn">
            {cards?.reservasPendentes ?? "—"}
          </p>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Alocações ativas</p>
          <p className="dash-card-value">
            {cards?.alocacoesAtivas ?? "—"}
          </p>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Custo total de eventos</p>
          <p className="dash-card-value">
            {cards
              ? `R$ ${Number(cards.custoPeriodo || 0).toFixed(2)}`
              : "—"}
          </p>
        </div>
      </div>

      {/* seção de atalhos */}
      <div className="dash-sections">
        <div className="dash-panel">
          <h3>Atalhos rápidos</h3>
          <p className="muted small">
            Vá direto para o que você mais usa.
          </p>
          <div className="dash-actions">
            <a href="#/reservas" className="dash-action-btn">
              Nova reserva
            </a>
            <a href="#/devolucoes" className="dash-action-btn">
              Registrar devolução
            </a>
            <a href="#/eventos" className="dash-action-btn">
              Registrar evento
            </a>
            <a href="#/beneficios" className="dash-action-btn">
              Alocação permanente
            </a>
          </div>
        </div>

        <div className="dash-panel">
          <h3>Status do usuário</h3>
          <ul className="dash-user-info">
            <li>
              <span>Nome</span>
              <strong>{currentUser?.nomUsuar || "—"}</strong>
            </li>
            <li>
              <span>E-mail</span>
              <strong>{currentUser?.dscEmailUsuar || "—"}</strong>
            </li>
            <li>
              <span>Perfil</span>
              <strong>{currentUser?.indPerfUsuar || "—"}</strong>
            </li>
            <li>
              <span>Supervisor</span>
              <strong>
                {currentUser?.idSupervUsuar?.nomUsuar ||
                  currentUser?.idSupervUsuar?.dscEmailUsuar ||
                  "—"}
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


  function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
      nomUsuar: "",
      dscEmailUsuar: "",
      dscSenhaUsuar: "",
      numTelUsuar: "",
      dscCargoUsuar: "",
      indPerfUsuar: "solicitante",
      indStatUsuar: "ativo",
      idSupervUsuar: "",
    });
    const [editId, setEditId] = useState(null);

    async function loadUsuarios() {
      try {
        const data = await baseFetch("/usuarios?limit=200", {}, token);
        setUsuarios(data.usuarios || []);
        setError("");
      } catch (e) {
        setError(e.message);
      }
    }

    useEffect(() => {
      if (token) loadUsuarios();
    }, [token]);

    async function handleCreate() {
      try {
        await baseFetch(
          "/usuarios",
          {
            method: "POST",
            body: JSON.stringify(form),
          },
          token
        );
        await loadUsuarios();
        await refreshSharedLists();
        setForm({
          nomUsuar: "",
          dscEmailUsuar: "",
          dscSenhaUsuar: "",
          numTelUsuar: "",
          dscCargoUsuar: "",
          indPerfUsuar: "solicitante",
          indStatUsuar: "ativo",
          idSupervUsuar: "",
        });
      } catch (e) {
        setError(e.message);
      }
    }

    async function handleUpdate() {
      try {
        await baseFetch(
          `/usuarios/${editId}`,
          {
            method: "PUT",
            body: JSON.stringify(form),
          },
          token
        );
        setEditId(null);
        await loadUsuarios();
        await refreshSharedLists();
      } catch (e) {
        setError(e.message);
      }
    }

    async function handleDelete(id) {
      if (!window.confirm("Excluir este usuário?")) return;
      try {
        await baseFetch(
          `/usuarios/${id}`,
          {
            method: "DELETE",
          },
          token
        );
        await loadUsuarios();
        await refreshSharedLists();
      } catch (e) {
        setError(e.message);
      }
    }

    function handleEdit(u) {
      setEditId(u._id);
      setForm({
        nomUsuar: u.nomUsuar || "",
        dscEmailUsuar: u.dscEmailUsuar || "",
        dscSenhaUsuar: "", // não exibimos hash
        numTelUsuar: u.numTelUsuar || "",
        dscCargoUsuar: u.dscCargoUsuar || "",
        indPerfUsuar: u.indPerfUsuar || "solicitante",
        indStatUsuar: u.indStatUsuar || "ativo",
        idSupervUsuar: u.idSupervUsuar?._id || "",
      });
    }

    return (
      <div>
        <h2>Usuários</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-grid">
          <label>Nome</label>
          <input
            value={form.nomUsuar}
            onChange={(e) => setForm({ ...form, nomUsuar: e.target.value })}
          />
          <label>E-mail</label>
          <input
            value={form.dscEmailUsuar}
            onChange={(e) =>
              setForm({ ...form, dscEmailUsuar: e.target.value })
            }
          />
          <label>Senha</label>
          <input
            type="password"
            value={form.dscSenhaUsuar}
            onChange={(e) =>
              setForm({ ...form, dscSenhaUsuar: e.target.value })
            }
          />
          <label>Telefone</label>
          <input
            value={form.numTelUsuar}
            onChange={(e) =>
              setForm({ ...form, numTelUsuar: e.target.value })
            }
          />
          <label>Cargo</label>
          <input
            value={form.dscCargoUsuar}
            onChange={(e) =>
              setForm({ ...form, dscCargoUsuar: e.target.value })
            }
          />
          <label>Perfil</label>
          <select
            value={form.indPerfUsuar}
            onChange={(e) =>
              setForm({ ...form, indPerfUsuar: e.target.value })
            }
          >
            <option value="solicitante">solicitante</option>
            <option value="supervisor">supervisor</option>
            <option value="gestor_frota">gestor_frota</option>
            <option value="admin">admin</option>
          </select>
          <label>Status</label>
          <select
            value={form.indStatUsuar}
            onChange={(e) =>
              setForm({ ...form, indStatUsuar: e.target.value })
            }
          >
            <option value="ativo">ativo</option>
            <option value="inativo">inativo</option>
            <option value="bloqueado">bloqueado</option>
          </select>
          <label>Supervisor</label>
          <select
            value={form.idSupervUsuar}
            onChange={(e) =>
              setForm({ ...form, idSupervUsuar: e.target.value })
            }
          >
            <option value="">(sem)</option>
            {usuariosList.map((u) => (
              <option key={u._id} value={u._id}>
                {u.nomUsuar} ({u.indPerfUsuar})
              </option>
            ))}
          </select>
        </div>
        {editId ? (
          <button onClick={handleUpdate}>Salvar alterações</button>
        ) : (
          <button onClick={handleCreate}>Criar usuário</button>
        )}

        <h3>Lista</h3>
        <div className="table-list">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Supervisor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u._id}>
                  <td>{u.nomUsuar}</td>
                  <td>{u.dscEmailUsuar}</td>
                  <td>{u.indPerfUsuar}</td>
                  <td>{u.indStatUsuar}</td>
                  <td>{u.idSupervUsuar?.nomUsuar || "-"}</td>
                  <td>
                    <button onClick={() => handleEdit(u)}>Editar</button>
                    <button onClick={() => handleDelete(u._id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }


function VeiculosPage() {
  const [veiculos, setVeiculos] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    dscFabricVeic: "",
    dscModelVeic: "",
    dscPlacaVeic: "",
    dscCorVeic: "",
    dscCombustVeic: "gasolina",
    dscTipoVeic: "carro",
    qtdPortaVeic: 4,
    dscOpcionVeic: "",
    dscRestrVeic: "",
    dscTipoHabVeic: "",
    indStatVeic: "disponivel",
  });
  const [editId, setEditId] = useState(null);

  async function loadVeiculos() {
    try {
      const data = await baseFetch("/veiculos", {}, token);
      setVeiculos(data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (token) loadVeiculos();
  }, [token]);

  async function handleCreate() {
    try {
      const payload = {
        ...form,
        dscOpcionVeic: form.dscOpcionVeic
          ? form.dscOpcionVeic
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      };

      await baseFetch(
        "/veiculos",
        { method: "POST", body: JSON.stringify(payload) },
        token
      );
      await loadVeiculos();
      await refreshSharedLists();

      setForm({
        dscFabricVeic: "",
        dscModelVeic: "",
        dscPlacaVeic: "",
        dscCorVeic: "",
        dscCombustVeic: "gasolina",
        dscTipoVeic: "carro",
        qtdPortaVeic: 4,
        dscOpcionVeic: "",
        dscRestrVeic: "",
        dscTipoHabVeic: "",
        indStatVeic: "disponivel",
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate() {
    try {
      const payload = {
        ...form,
        dscOpcionVeic: form.dscOpcionVeic
          ? form.dscOpcionVeic
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      };

      await baseFetch(
        `/veiculos/${editId}`,
        { method: "PUT", body: JSON.stringify(payload) },
        token
      );
      setEditId(null);
      await loadVeiculos();
      await refreshSharedLists();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir veículo?")) return;
    try {
      await baseFetch(`/veiculos/${id}`, { method: "DELETE" }, token);
      await loadVeiculos();
      await refreshSharedLists();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(v) {
    setEditId(v._id);
    setForm({
      dscFabricVeic: v.dscFabricVeic || "",
      dscModelVeic: v.dscModelVeic || "",
      dscPlacaVeic: v.dscPlacaVeic || "",
      dscCorVeic: v.dscCorVeic || "",
      dscCombustVeic: v.dscCombustVeic || "gasolina",
      dscTipoVeic: v.dscTipoVeic || "carro",
      qtdPortaVeic: v.qtdPortaVeic || 4,
      dscOpcionVeic: Array.isArray(v.dscOpcionVeic)
        ? v.dscOpcionVeic.join(", ")
        : "",
      dscRestrVeic: v.dscRestrVeic || "",
      dscTipoHabVeic: v.dscTipoHabVeic || "",
      indStatVeic: v.indStatVeic || "disponivel",
    });
  }

  return (
    <div>
      <h2>Veículos</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="form-grid">
        <label>Fabricante</label>
        <input
          value={form.dscFabricVeic}
          onChange={(e) => setForm({ ...form, dscFabricVeic: e.target.value })}
        />

        <label>Modelo</label>
        <input
          value={form.dscModelVeic}
          onChange={(e) => setForm({ ...form, dscModelVeic: e.target.value })}
        />

        <label>Tipo do veículo</label>
        <select
          value={form.dscTipoVeic}
          onChange={(e) => setForm({ ...form, dscTipoVeic: e.target.value })}
        >
          <option value="carro">carro</option>
          <option value="moto">moto</option>
          <option value="van">van</option>
          <option value="triciclo">triciclo</option>
          <option value="trator">trator</option>
          <option value="barco">barco</option>
          <option value="aviao_pequeno">avião pequeno</option>
          <option value="outro">outro</option>
        </select>

        <label>Placa</label>
        <input
          value={form.dscPlacaVeic}
          onChange={(e) => setForm({ ...form, dscPlacaVeic: e.target.value })}
          placeholder="opcional p/ barco, trator..."
        />

        <label>Cor</label>
        <input
          value={form.dscCorVeic}
          onChange={(e) => setForm({ ...form, dscCorVeic: e.target.value })}
        />

        <label>Combustível</label>
        <select
          value={form.dscCombustVeic}
          onChange={(e) =>
            setForm({ ...form, dscCombustVeic: e.target.value })
          }
        >
          <option value="gasolina">gasolina</option>
          <option value="etanol">etanol</option>
          <option value="diesel">diesel</option>
          <option value="elétrico">elétrico</option>
          <option value="híbrido">híbrido</option>
        </select>

        <label>Portas</label>
        <input
          type="number"
          value={form.qtdPortaVeic}
          onChange={(e) =>
            setForm({ ...form, qtdPortaVeic: Number(e.target.value) })
          }
        />

        <label>Opcionais (vírgula)</label>
        <input
          value={form.dscOpcionVeic}
          onChange={(e) => setForm({ ...form, dscOpcionVeic: e.target.value })}
          placeholder="ar, direção, airbag..."
        />

        <label>Restrição de uso</label>
        <input
          value={form.dscRestrVeic}
          onChange={(e) => setForm({ ...form, dscRestrVeic: e.target.value })}
          placeholder="rodízio, horário, setor..."
        />

        <label>Habilitação necessária</label>
        <input
          value={form.dscTipoHabVeic}
          onChange={(e) => setForm({ ...form, dscTipoHabVeic: e.target.value })}
          placeholder="B, C, D, náutica..."
        />

        <label>Status</label>
        <select
          value={form.indStatVeic}
          onChange={(e) => setForm({ ...form, indStatVeic: e.target.value })}
        >
          <option value="disponivel">disponível</option>
          <option value="reservado">reservado</option>
          <option value="em_manutencao">em manutenção</option>
          <option value="indisponivel">indisponível</option>
        </select>
      </div>

      {editId ? (
        <button onClick={handleUpdate}>Salvar veículo</button>
      ) : (
        <button onClick={handleCreate}>Cadastrar veículo</button>
      )}

      <div className="table-list">
        <table>
          <thead>
            <tr>
              <th>Fabricante</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Placa</th>
              <th>Comb.</th>
              <th>Opcionais</th>
              <th>Hab.</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {veiculos.map((v) => (
              <tr key={v._id}>
                <td>{v.dscFabricVeic}</td>
                <td>{v.dscModelVeic}</td>
                <td>{v.dscTipoVeic}</td>
                <td>{v.dscPlacaVeic}</td>
                <td>{v.dscCombustVeic}</td>
                <td>
                  {Array.isArray(v.dscOpcionVeic)
                    ? v.dscOpcionVeic.join(", ")
                    : ""}
                </td>
                <td>{v.dscTipoHabVeic}</td>
                <td>{v.indStatVeic}</td>
                <td>
                  <button onClick={() => handleEdit(v)}>Editar</button>
                  <button onClick={() => handleDelete(v._id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ReservasPage({
  user,
  usuariosList = [],
  veiculosList = [],
  baseFetch,
  token,
  refreshSharedLists,
}) {
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    idSolicitUsuar: "",
    idSupervAprov: "",
    idVeicReserva: "",
    datUsoReserva: "",
    datDevPrevReserva: "",
    dscDestinoReserva: "",
    dscFinalidReserva: "",
    qtdKmEstReserva: "",
    valCombEstReserva: "",
    dscObsReserva: "",
  });

  // quem pode ser supervisor
  const supervisores = usuariosList.filter((u) =>
    ["supervisor", "gestor_frota", "admin"].includes(u.indPerfUsuar)
  );

  // helper pra formatar ISO -> datetime-local
  function toInputDateTime(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  async function loadReservas() {
    try {
      const data = await baseFetch("/reservas", {}, token);
      const lista = Array.isArray(data) ? data : data.reservas || [];
      setReservas(lista);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  // carrega reservas
  useEffect(() => {
    if (token) {
      loadReservas();
    }
  }, [token]);

  // pré-preencher solicitante e supervisor
  useEffect(() => {
    if (!user) return;

    // tenta achar o usuário completo na lista
    const usuarioCompleto =
      usuariosList.find((u) => u._id === user._id) ||
      usuariosList.find((u) => u.dscEmailUsuar === user.dscEmailUsuar);

    const solicitanteId = user._id || usuarioCompleto?._id || "";

    let supervisorId = "";
    if (user.idSupervUsuar) {
      supervisorId =
        typeof user.idSupervUsuar === "string"
          ? user.idSupervUsuar
          : user.idSupervUsuar._id;
    } else if (usuarioCompleto && usuarioCompleto.idSupervUsuar) {
      supervisorId =
        typeof usuarioCompleto.idSupervUsuar === "string"
          ? usuarioCompleto.idSupervUsuar
          : usuarioCompleto.idSupervUsuar._id;
    }

    setForm((prev) => {
      // evita loops
      if (
        prev.idSolicitUsuar === solicitanteId &&
        prev.idSupervAprov === supervisorId
      ) {
        return prev;
      }
      return {
        ...prev,
        idSolicitUsuar: solicitanteId,
        idSupervAprov: supervisorId,
      };
    });
  }, [user, usuariosList]);

  async function handleCreate() {
    try {
      const payload = {
        idSolicitUsuar: form.idSolicitUsuar, // mesmo que o controller pegue do token, não faz mal mandar
        idSupervAprov: form.idSupervAprov || undefined,
        idVeicReserva: form.idVeicReserva,
        datUsoReserva: form.datUsoReserva
          ? new Date(form.datUsoReserva).toISOString()
          : undefined,
        datDevPrevReserva: form.datDevPrevReserva
          ? new Date(form.datDevPrevReserva).toISOString()
          : undefined,
        dscDestinoReserva: form.dscDestinoReserva,
        dscFinalidReserva: form.dscFinalidReserva,
        qtdKmEstReserva: form.qtdKmEstReserva
          ? Number(form.qtdKmEstReserva)
          : undefined,
        valCombEstReserva: form.valCombEstReserva
          ? Number(form.valCombEstReserva)
          : undefined,
        dscObsReserva: form.dscObsReserva || undefined,
      };

      await baseFetch(
        "/reservas",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadReservas();
      await refreshSharedLists?.();

      // limpa campos mutáveis, mantém solicitante e supervisor
      setForm((prev) => ({
        ...prev,
        idVeicReserva: "",
        datUsoReserva: "",
        datDevPrevReserva: "",
        dscDestinoReserva: "",
        dscFinalidReserva: "",
        qtdKmEstReserva: "",
        valCombEstReserva: "",
        dscObsReserva: "",
      }));
      setEditId(null);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    try {
      const payload = {
        idSupervAprov: form.idSupervAprov || undefined,
        idVeicReserva: form.idVeicReserva,
        datUsoReserva: form.datUsoReserva
          ? new Date(form.datUsoReserva).toISOString()
          : undefined,
        datDevPrevReserva: form.datDevPrevReserva
          ? new Date(form.datDevPrevReserva).toISOString()
          : undefined,
        dscDestinoReserva: form.dscDestinoReserva,
        dscFinalidReserva: form.dscFinalidReserva,
        qtdKmEstReserva: form.qtdKmEstReserva
          ? Number(form.qtdKmEstReserva)
          : undefined,
        valCombEstReserva: form.valCombEstReserva
          ? Number(form.valCombEstReserva)
          : undefined,
        dscObsReserva: form.dscObsReserva || undefined,
      };

      await baseFetch(
        `/reservas/${editId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadReservas();
      await refreshSharedLists?.();
      setEditId(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(r) {
    setEditId(r._id);
    setForm({
      idSolicitUsuar:
        typeof r.idSolicitUsuar === "object"
          ? r.idSolicitUsuar._id
          : r.idSolicitUsuar,
      idSupervAprov:
        typeof r.idSupervAprov === "object"
          ? r.idSupervAprov._id
          : r.idSupervAprov || "",
      idVeicReserva:
        typeof r.idVeicReserva === "object"
          ? r.idVeicReserva._id
          : r.idVeicReserva,
      datUsoReserva: toInputDateTime(r.datUsoReserva),
      datDevPrevReserva: toInputDateTime(r.datDevPrevReserva),
      dscDestinoReserva: r.dscDestinoReserva || "",
      dscFinalidReserva: r.dscFinalidReserva || "",
      qtdKmEstReserva: r.qtdKmEstReserva || "",
      valCombEstReserva: r.valCombEstReserva || "",
      dscObsReserva: r.dscObsReserva || "",
    });
  }

  async function handleAprovar(id) {
    try {
      await baseFetch(
        `/reservas/${id}/aprovar`,
        {
          method: "POST",
          body: JSON.stringify({
            idSupervAprov: user?._id, // quem está aprovando
          }),
        },
        token
      );
      await loadReservas();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRejeitar(id) {
    try {
      await baseFetch(
        `/reservas/${id}/rejeitar`,
        {
          method: "POST",
        },
        token
      );
      await loadReservas();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCancelar(id) {
    try {
      await baseFetch(
        `/reservas/${id}/cancelar`,
        {
          method: "POST",
        },
        token
      );
      await loadReservas();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h2>Reservas</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="form-grid">
        {/* Solicitante (vem do login) */}
        <label>Solicitante</label>
        {user ? (
          <select value={form.idSolicitUsuar} disabled>
            <option value={form.idSolicitUsuar}>
              {user.nomUsuar || user.dscEmailUsuar}
            </option>
          </select>
        ) : (
          <select
            value={form.idSolicitUsuar}
            onChange={(e) =>
              setForm({ ...form, idSolicitUsuar: e.target.value })
            }
          >
            <option value="">selecione...</option>
            {usuariosList.map((u) => (
              <option key={u._id} value={u._id}>
                {u.nomUsuar}
              </option>
            ))}
          </select>
        )}

        {/* Supervisor/aprovador */}
        <label>Supervisor / aprovador</label>
        <select
          value={form.idSupervAprov}
          onChange={(e) => setForm({ ...form, idSupervAprov: e.target.value })}
        >
          <option value="">selecione...</option>
          {supervisores.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nomUsuar}
            </option>
          ))}
        </select>

        {/* Veículo */}
        <label>Veículo</label>
        <select
          value={form.idVeicReserva}
          onChange={(e) =>
            setForm({ ...form, idVeicReserva: e.target.value })
          }
        >
          <option value="">selecione...</option>
          {veiculosList.map((v) => (
            <option key={v._id} value={v._id}>
              {v.dscModelVeic} - {v.dscPlacaVeic || v.dscFabricVeic}
            </option>
          ))}
        </select>

        {/* Data de uso */}
        <label>Data/hora de uso</label>
        <input
          type="datetime-local"
          value={form.datUsoReserva}
          onChange={(e) => setForm({ ...form, datUsoReserva: e.target.value })}
        />

        {/* Devolução prevista */}
        <label>Devolução prevista</label>
        <input
          type="datetime-local"
          value={form.datDevPrevReserva}
          onChange={(e) =>
            setForm({ ...form, datDevPrevReserva: e.target.value })
          }
        />

        {/* Destino */}
        <label>Destino</label>
        <input
          value={form.dscDestinoReserva}
          onChange={(e) =>
            setForm({ ...form, dscDestinoReserva: e.target.value })
          }
        />

        {/* Finalidade */}
        <label>Finalidade</label>
        <input
          value={form.dscFinalidReserva}
          onChange={(e) =>
            setForm({ ...form, dscFinalidReserva: e.target.value })
          }
        />

        {/* KM estimada */}
        <label>KM estimada</label>
        <input
          type="number"
          value={form.qtdKmEstReserva}
          onChange={(e) =>
            setForm({ ...form, qtdKmEstReserva: e.target.value })
          }
        />

        {/* Combustível estimado */}
        <label>Combustível estimado (L)</label>
        <input
          type="number"
          value={form.valCombEstReserva}
          onChange={(e) =>
            setForm({ ...form, valCombEstReserva: e.target.value })
          }
        />

        {/* Observação */}
        <label>Observações</label>
        <input
          value={form.dscObsReserva}
          onChange={(e) =>
            setForm({ ...form, dscObsReserva: e.target.value })
          }
        />
      </div>

      {editId ? (
        <button onClick={handleUpdate}>Salvar alterações</button>
      ) : (
        <button onClick={handleCreate}>Criar reserva</button>
      )}

      <h3>Lista de reservas</h3>
      <div className="table-list">
        <table>
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Supervisor</th>
              <th>Veículo</th>
              <th>Uso</th>
              <th>Devolução prev.</th>
              <th>Destino</th>
              <th>Finalidade</th>
              <th>KM</th>
              <th>Comb.</th>
              <th>Status</th>
              <th>Obs</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r._id}>
                <td>{r.idSolicitUsuar?.nomUsuar || "-"}</td>
                <td>{r.idSupervAprov?.nomUsuar || "-"}</td>
                <td>
                  {r.idVeicReserva
                    ? r.idVeicReserva.dscModelVeic ||
                      r.idVeicReserva.dscFabricVeic
                    : "-"}
                </td>
                <td>
                  {r.datUsoReserva
                    ? new Date(r.datUsoReserva).toLocaleString()
                    : "-"}
                </td>
                <td>
                  {r.datDevPrevReserva
                    ? new Date(r.datDevPrevReserva).toLocaleString()
                    : "-"}
                </td>
                <td>{r.dscDestinoReserva}</td>
                <td>{r.dscFinalidReserva}</td>
                <td>{r.qtdKmEstReserva ?? "-"}</td>
                <td>{r.valCombEstReserva ?? "-"}</td>
                <td>{r.indStatReserva}</td>
                <td>{r.dscObsReserva}</td>
                <td>
                  <button onClick={() => handleEdit(r)}>Editar</button>
                  <button onClick={() => handleAprovar(r._id)}>Aprovar</button>
                  <button onClick={() => handleRejeitar(r._id)}>
                    Rejeitar
                  </button>
                  <button onClick={() => handleCancelar(r._id)}>
                    Cancelar
                  </button>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr>
                <td colSpan={12}>Nenhuma reserva encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevolucoesPage({ baseFetch, token, user }) {
  const [reservas, setReservas] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    idReservaDevol: "",
    idUsuarDevol: "",
    datDevol: "",
    dscLocalDevol: "",
    qtdKmPercDevol: "",
    valCombFinalDevol: "",
    dscLatariaDevol: "",
    dscPneusDevol: "",
    dscMotorDevol: "",
    dscObsDevol: "",
    dscFeedbkDevol: "",
  });

  function formatarDataBR(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("pt-BR");
  }

  // carrega todas as reservas
  async function loadReservas() {
    try {
      const data = await baseFetch("/reservas", {}, token);
      const lista = Array.isArray(data) ? data : data.reservas || [];
      setReservas(lista);
    } catch (e) {
      setError(e.message || "Erro ao carregar reservas");
    }
  }

  // carrega devoluções
  async function loadDevolucoes() {
    try {
      const data = await baseFetch("/devolucoes", {}, token);
      const lista = Array.isArray(data) ? data : data.devolucoes || [];
      setDevolucoes(lista);
    } catch (e) {
      console.warn("GET /devolucoes não disponível:", e.message);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadReservas();
    loadDevolucoes();
  }, [token]);

  // coloca o usuário logado como quem devolve
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      idUsuarDevol: user._id,
      datDevol: new Date().toISOString().slice(0, 16),
    }));
  }, [user]);

  function handleSelectReserva(reservaId) {
    setForm((prev) => ({ ...prev, idReservaDevol: reservaId }));
    const resv = reservas.find((r) => r._id === reservaId) || null;
    setSelectedReserva(resv);
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

    try {
      if (!form.idReservaDevol) {
        setError("Selecione a reserva que está sendo devolvida.");
        setLoading(false);
        return;
      }
      if (!form.idUsuarDevol) {
        setError("Não foi possível identificar o usuário que está devolvendo.");
        setLoading(false);
        return;
      }

      const datDevolISO = form.datDevol
        ? new Date(form.datDevol).toISOString()
        : new Date().toISOString();

      const payload = {
        idReservaDevol: form.idReservaDevol,
        idUsuarDevol: form.idUsuarDevol,
        datDevol: datDevolISO,
        dscLocalDevol: form.dscLocalDevol || undefined,
        qtdKmPercDevol: form.qtdKmPercDevol
          ? Number(form.qtdKmPercDevol)
          : undefined,
        valCombFinalDevol: form.valCombFinalDevol
          ? Number(form.valCombFinalDevol)
          : undefined,
        dscLatariaDevol: form.dscLatariaDevol || undefined,
        dscPneusDevol: form.dscPneusDevol || undefined,
        dscMotorDevol: form.dscMotorDevol || undefined,
        dscObsDevol: form.dscObsDevol || undefined,
        dscFeedbkDevol: form.dscFeedbkDevol || undefined,
      };

      await baseFetch(
        "/devolucoes",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadDevolucoes();
      await loadReservas(); // reserva pode mudar de status

      setForm((prev) => ({
        ...prev,
        idReservaDevol: "",
        dscLocalDevol: "",
        qtdKmPercDevol: "",
        valCombFinalDevol: "",
        dscLatariaDevol: "",
        dscPneusDevol: "",
        dscMotorDevol: "",
        dscObsDevol: "",
        dscFeedbkDevol: "",
      }));
      setSelectedReserva(null);
    } catch (e) {
      setError(e.message || "Erro ao registrar devolução");
    } finally {
      setLoading(false);
    }
  }

  // FILTRO: só reservas que ainda podem ser devolvidas
  // vamos excluir concluida, cancelada, rejeitada
  const reservasAtivas = reservas.filter((r) => {
    const st = r.indStatReserva || r.indStatResrv;
    return !["concluida", "cancelada", "rejeitada"].includes(st);
  });

  return (
    <div>
      <h2>Devolução de veículo</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="form-grid">
        {/* RESERVA (apenas ativas) */}
        <label>Reserva</label>
        <select
          value={form.idReservaDevol}
          onChange={(e) => handleSelectReserva(e.target.value)}
        >
          <option value="">Selecione a reserva...</option>
          {reservasAtivas.map((r) => {
            const nome =
              r.idSolicitUsuar?.nomUsuar ||
              r.idSolicitUsuar?.dscEmailUsuar ||
              "Solicitante";
            const veic =
              r.idVeicReserva?.dscModelVeic ||
              r.idVeicReserva?.dscFabricVeic ||
              "Veículo";
            const devPrev = r.datDevPrevReserva
              ? formatarDataBR(r.datDevPrevReserva)
              : "-";
            return (
              <option key={r._id} value={r._id}>
                {nome} — {veic} — devolução prevista: {devPrev}
              </option>
            );
          })}
        </select>

        {/* CONTEXTO DA RESERVA SELECIONADA */}
        {selectedReserva && (
          <>
            <label>Funcionário</label>
            <input
              disabled
              value={
                selectedReserva.idSolicitUsuar?.nomUsuar ||
                selectedReserva.idSolicitUsuar?.dscEmailUsuar ||
                ""
              }
            />

            <label>Veículo</label>
            <input
              disabled
              value={
                selectedReserva.idVeicReserva
                  ? `${selectedReserva.idVeicReserva.dscModelVeic || ""}${
                      selectedReserva.idVeicReserva.dscPlacaVeic
                        ? " - " + selectedReserva.idVeicReserva.dscPlacaVeic
                        : ""
                    }`
                  : ""
              }
            />

            <label>Data da retirada</label>
            <input
              disabled
              value={
                selectedReserva.datUsoReserva
                  ? formatarDataBR(selectedReserva.datUsoReserva)
                  : ""
              }
            />

            <label>Devolução prevista</label>
            <input
              disabled
              value={
                selectedReserva.datDevPrevReserva
                  ? formatarDataBR(selectedReserva.datDevPrevReserva)
                  : ""
              }
            />
          </>
        )}

        {/* DATA REAL DA DEVOLUÇÃO */}
        <label>Data/hora da devolução</label>
        <input
          type="datetime-local"
          value={form.datDevol}
          onChange={(e) => setForm({ ...form, datDevol: e.target.value })}
        />

        <label>Local da devolução</label>
        <input
          value={form.dscLocalDevol}
          onChange={(e) =>
            setForm({ ...form, dscLocalDevol: e.target.value })
          }
        />

        <label>Quilometragem percorrida</label>
        <input
          type="number"
          value={form.qtdKmPercDevol}
          onChange={(e) =>
            setForm({ ...form, qtdKmPercDevol: e.target.value })
          }
        />

        <label>Combustível final</label>
        <input
          type="number"
          value={form.valCombFinalDevol}
          onChange={(e) =>
            setForm({ ...form, valCombFinalDevol: e.target.value })
          }
        />

        <label>Estado da lataria</label>
        <input
          value={form.dscLatariaDevol}
          onChange={(e) =>
            setForm({ ...form, dscLatariaDevol: e.target.value })
          }
        />

        <label>Estado dos pneus</label>
        <input
          value={form.dscPneusDevol}
          onChange={(e) => setForm({ ...form, dscPneusDevol: e.target.value })}
        />

        <label>Estado do motor</label>
        <input
          value={form.dscMotorDevol}
          onChange={(e) => setForm({ ...form, dscMotorDevol: e.target.value })}
        />

        <label>Observações</label>
        <textarea
          rows={2}
          value={form.dscObsDevol}
          onChange={(e) => setForm({ ...form, dscObsDevol: e.target.value })}
        />

        <label>Feedback / recomendação</label>
        <textarea
          rows={2}
          value={form.dscFeedbkDevol}
          onChange={(e) =>
            setForm({ ...form, dscFeedbkDevol: e.target.value })
          }
        />
      </div>

      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Salvando..." : "Registrar devolução"}
      </button>

      <h3>Devoluções registradas</h3>
      <div className="table-list">
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Veículo</th>
              <th>Dev. prevista</th>
              <th>Dev. real</th>
              <th>KM</th>
              <th>Comb.</th>
              <th>Lataria</th>
              <th>Pneus</th>
              <th>Motor</th>
              <th>Obs</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {devolucoes.map((d) => {
              const resv = d.idReservaDevol;
              // funcionário: prioridade reserva -> devolução
              const funcionario =
                resv?.idSolicitUsuar?.nomUsuar ||
                resv?.idSolicitUsuar?.dscEmailUsuar ||
                d.idUsuarDevol?.nomUsuar ||
                d.idUsuarDevol?.dscEmailUsuar ||
                d.idUsuarDevol ||
                "-";

              const veic = resv?.idVeicReserva
                ? `${resv.idVeicReserva.dscModelVeic || ""}${
                    resv.idVeicReserva.dscPlacaVeic
                      ? " - " + resv.idVeicReserva.dscPlacaVeic
                      : ""
                  }`
                : "-";

              const devPrev = resv?.datDevPrevReserva
                ? formatarDataBR(resv.datDevPrevReserva)
                : "-";

              const devReal = d.datDevol ? formatarDataBR(d.datDevol) : "-";

              return (
                <tr key={d._id}>
                  <td>{funcionario}</td>
                  <td>{veic}</td>
                  <td>{devPrev}</td>
                  <td>{devReal}</td>
                  <td>{d.qtdKmPercDevol ?? "-"}</td>
                  <td>{d.valCombFinalDevol ?? "-"}</td>
                  <td>{d.dscLatariaDevol ?? "-"}</td>
                  <td>{d.dscPneusDevol ?? "-"}</td>
                  <td>{d.dscMotorDevol ?? "-"}</td>
                  <td>{d.dscObsDevol ?? "-"}</td>
                  <td>{d.dscFeedbkDevol ?? "-"}</td>
                </tr>
              );
            })}
            {devolucoes.length === 0 && (
              <tr>
                <td colSpan={11}>Nenhuma devolução registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function EventosPage({
  baseFetch,
  token,
  user,
  veiculosList = [],
  usuariosList = [],
}) {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    idVeicEvent: "",
    idUsuarEvent: "",
    dscTipoEvent: "manutencao",
    datEvent: "",
    dscLocalEvent: "",
    valEvent: "",
    dscDetalEvent: "",
    dscComprovEvent: "",
    dscTipoLogrEvent: "",
    dscNomeLogrEvent: "",
    numLogrEvent: "",
    dscBairroEvent: "",
    dscCidadeEvent: "",
    dscEstadoEvent: "",
    numCepEvent: "",
  });

  function formatarDataBR(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("pt-BR");
  }

  async function loadEventos() {
    try {
      const data = await baseFetch("/eventos", {}, token);
      const lista = Array.isArray(data) ? data : data.eventos || [];
      setEventos(lista);
    } catch (e) {
      setError(e.message || "Erro ao carregar eventos");
    }
  }

  useEffect(() => {
    if (!token) return;
    loadEventos();
  }, [token]);

  // assim que tiver usuário logado, pré-seleciona como responsável
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      idUsuarEvent: user._id,
      datEvent: new Date().toISOString().slice(0, 16),
    }));
  }, [user]);

  async function handleCreate() {
    setLoading(true);
    setError("");

    try {
      if (!form.idVeicEvent) {
        setError("Selecione o veículo do evento.");
        setLoading(false);
        return;
      }
      if (!form.idUsuarEvent) {
        setError("Selecione o responsável pelo evento.");
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        datEvent: form.datEvent
          ? new Date(form.datEvent).toISOString()
          : new Date().toISOString(),
        valEvent: form.valEvent ? Number(form.valEvent) : undefined,
      };

      await baseFetch(
        "/eventos",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadEventos();

      setForm((prev) => ({
        ...prev,
        idVeicEvent: "",
        dscTipoEvent: "manutencao",
        datEvent: new Date().toISOString().slice(0, 16),
        dscLocalEvent: "",
        valEvent: "",
        dscDetalEvent: "",
        dscComprovEvent: "",
        dscTipoLogrEvent: "",
        dscNomeLogrEvent: "",
        numLogrEvent: "",
        dscBairroEvent: "",
        dscCidadeEvent: "",
        dscEstadoEvent: "",
        numCepEvent: "",
      }));
    } catch (e) {
      setError(e.message || "Erro ao registrar evento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Eventos do veículo</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="form-grid">
        {/* Veículo */}
        <label>Veículo</label>
        <select
          value={form.idVeicEvent}
          onChange={(e) => setForm({ ...form, idVeicEvent: e.target.value })}
        >
          <option value="">Selecione o veículo...</option>
          {veiculosList.map((v) => (
            <option key={v._id} value={v._id}>
              {v.dscModelVeic} {v.dscPlacaVeic ? `- ${v.dscPlacaVeic}` : ""}
            </option>
          ))}
        </select>

        {/* Responsável (agora dropdown de usuários) */}
        <label>Responsável</label>
        <select
          value={form.idUsuarEvent}
          onChange={(e) => setForm({ ...form, idUsuarEvent: e.target.value })}
        >
          <option value="">Selecione o responsável...</option>
          {usuariosList.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nomUsuar || u.dscEmailUsuar}
            </option>
          ))}
        </select>

        {/* Tipo do evento */}
        <label>Tipo de evento</label>
        <select
          value={form.dscTipoEvent}
          onChange={(e) => setForm({ ...form, dscTipoEvent: e.target.value })}
        >
          <option value="manutencao">Manutenção</option>
          <option value="revisao">Revisão</option>
          <option value="lavagem">Lavagem</option>
          <option value="troca_pneus">Troca de pneus</option>
          <option value="conserto">Conserto</option>
          <option value="batida">Batida</option>
          <option value="guincho">Guincho</option>
          <option value="roubo">Roubo</option>
          <option value="inspecao">Inspeção</option>
          <option value="lacracao">Lacração</option>
          <option value="licenciamento">Licenciamento</option>
        </select>

        <label>Data do evento</label>
        <input
          type="datetime-local"
          value={form.datEvent}
          onChange={(e) => setForm({ ...form, datEvent: e.target.value })}
        />

        <label>Local</label>
        <input
          value={form.dscLocalEvent}
          onChange={(e) => setForm({ ...form, dscLocalEvent: e.target.value })}
        />

        <label>Valor (R$)</label>
        <input
          type="number"
          value={form.valEvent}
          onChange={(e) => setForm({ ...form, valEvent: e.target.value })}
        />

        <label>Detalhes do evento</label>
        <textarea
          rows={2}
          value={form.dscDetalEvent}
          onChange={(e) => setForm({ ...form, dscDetalEvent: e.target.value })}
        />

        <label>Comprovante (URL/caminho)</label>
        <input
          value={form.dscComprovEvent}
          onChange={(e) =>
            setForm({ ...form, dscComprovEvent: e.target.value })
          }
        />

        {/* endereço opcional, mantendo o padrão do professor */}
        <label>Tipo logradouro</label>
        <input
          value={form.dscTipoLogrEvent}
          onChange={(e) =>
            setForm({ ...form, dscTipoLogrEvent: e.target.value })
          }
        />

        <label>Nome logradouro</label>
        <input
          value={form.dscNomeLogrEvent}
          onChange={(e) =>
            setForm({ ...form, dscNomeLogrEvent: e.target.value })
          }
        />

        <label>Número</label>
        <input
          value={form.numLogrEvent}
          onChange={(e) => setForm({ ...form, numLogrEvent: e.target.value })}
        />

        <label>Bairro</label>
        <input
          value={form.dscBairroEvent}
          onChange={(e) =>
            setForm({ ...form, dscBairroEvent: e.target.value })
          }
        />

        <label>Cidade</label>
        <input
          value={form.dscCidadeEvent}
          onChange={(e) =>
            setForm({ ...form, dscCidadeEvent: e.target.value })
          }
        />

        <label>Estado</label>
        <input
          value={form.dscEstadoEvent}
          onChange={(e) =>
            setForm({ ...form, dscEstadoEvent: e.target.value })
          }
        />

        <label>CEP</label>
        <input
          value={form.numCepEvent}
          onChange={(e) => setForm({ ...form, numCepEvent: e.target.value })}
        />
      </div>

      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Salvando..." : "Registrar evento"}
      </button>

      <h3>Eventos registrados</h3>
      <div className="table-list">
        <table>
          <thead>
            <tr>
              <th>Veículo</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Responsável</th>
              <th>Local</th>
              <th>Valor</th>
              <th>Detalhes</th>
              <th>Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev._id}>
                <td>
                    {ev.idVeicEvent
                      ? `${ev.idVeicEvent.dscModelVeic || ""}${
                          ev.idVeicEvent.dscPlacaVeic
                            ? " - " + ev.idVeicEvent.dscPlacaVeic
                            : ""
                        }`
                      : "-"}
                </td>
                <td>{ev.dscTipoEvent}</td>
                <td>{ev.datEvent ? formatarDataBR(ev.datEvent) : "-"}</td>
                <td>
                  {ev.idUsuarEvent
                    ? ev.idUsuarEvent.nomUsuar ||
                      ev.idUsuarEvent.dscEmailUsuar ||
                      "-"
                    : "-"}
                </td>
                <td>{ev.dscLocalEvent || "-"}</td>
                <td>{ev.valEvent != null ? `R$ ${ev.valEvent}` : "-"}</td>
                <td>{ev.dscDetalEvent || "-"}</td>
                <td>{ev.dscComprovEvent || "-"}</td>
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr>
                <td colSpan={8}>Nenhum evento registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function BeneficiosPage({
  user,
  usuariosList = [],
  veiculosList = [],
  baseFetch,
  token,
}) {
  const [beneficios, setBeneficios] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    idUsuarAloc: "",
    idVeicAloc: "",
    idMotExclAloc: "",
    indFdsAloc: false,
    dscLocalEstacAloc: "",
    numPriorAloc: 0,
    dscJustfAloc: "",
    datInicioAloc: "",
    datFimAloc: "",
  });

  const podeGerenciar =
    user &&
    (user.indPerfUsuar === "admin" || user.indPerfUsuar === "gestor_frota");

  async function loadBeneficios() {
    try {
      setLoading(true);
      const data = await baseFetch("/beneficios", {}, token);
      setBeneficios(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      setError(e.message || "Erro ao carregar benefícios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadBeneficios();
  }, [token]);

  function resetForm() {
    setForm({
      idUsuarAloc: "",
      idVeicAloc: "",
      idMotExclAloc: "",
      indFdsAloc: false,
      dscLocalEstacAloc: "",
      numPriorAloc: 0,
      dscJustfAloc: "",
      datInicioAloc: "",
      datFimAloc: "",
    });
    setEditId(null);
  }

  async function handleCreate() {
    if (!podeGerenciar) {
      setError("Seu perfil não pode criar alocação.");
      return;
    }
    try {
      const payload = {
        ...form,
        indFdsAloc: !!form.indFdsAloc,
        numPriorAloc: Number(form.numPriorAloc) || 0,
      };

      // se não vier data de início, usa agora
      if (!payload.datInicioAloc) {
        payload.datInicioAloc = new Date().toISOString();
      } else {
        payload.datInicioAloc = new Date(payload.datInicioAloc).toISOString();
      }

      if (!payload.idMotExclAloc) delete payload.idMotExclAloc;
      if (!payload.datFimAloc) delete payload.datFimAloc;
      else payload.datFimAloc = new Date(payload.datFimAloc).toISOString();

      await baseFetch(
        "/beneficios",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadBeneficios();
      resetForm();
    } catch (e) {
      setError(e.message || "Erro ao criar benefício");
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    try {
      const payload = {
        ...form,
        indFdsAloc: !!form.indFdsAloc,
        numPriorAloc: Number(form.numPriorAloc) || 0,
      };

      if (payload.datInicioAloc)
        payload.datInicioAloc = new Date(payload.datInicioAloc).toISOString();
      if (payload.datFimAloc)
        payload.datFimAloc = new Date(payload.datFimAloc).toISOString();
      else delete payload.datFimAloc;

      if (!payload.idMotExclAloc) payload.idMotExclAloc = null;

      await baseFetch(
        `/beneficios/${editId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
        token
      );

      await loadBeneficios();
      resetForm();
    } catch (e) {
      setError(e.message || "Erro ao atualizar benefício");
    }
  }

  function handleEdit(b) {
    setEditId(b._id);
    setForm({
      idUsuarAloc: b.idUsuarAloc?._id || b.idUsuarAloc || "",
      idVeicAloc: b.idVeicAloc?._id || b.idVeicAloc || "",
      idMotExclAloc: b.idMotExclAloc?._id || b.idMotExclAloc || "",
      indFdsAloc: !!b.indFdsAloc,
      dscLocalEstacAloc: b.dscLocalEstacAloc || b.dscLocalEstac || "",
      numPriorAloc: typeof b.numPriorAloc === "number" ? b.numPriorAloc : 0,
      dscJustfAloc: b.dscJustfAloc || "",
      datInicioAloc: b.datInicioAloc
        ? new Date(b.datInicioAloc).toISOString().slice(0, 16)
        : "",
      datFimAloc: b.datFimAloc
        ? new Date(b.datFimAloc).toISOString().slice(0, 16)
        : "",
    });
  }

  async function handleEncerrar(b) {
    if (!podeGerenciar) return;
    if (!window.confirm("Encerrar esta alocação?")) return;
    try {
      await baseFetch(
        `/beneficios/${b._id}/encerrar`,
        { method: "POST" },
        token
      );
      await loadBeneficios();
    } catch (e) {
      setError(e.message || "Erro ao encerrar benefício");
    }
  }

  // helpers de exibição
  function resolveUsuario(b) {
    if (b.idUsuarAloc && typeof b.idUsuarAloc === "object") {
      return `${b.idUsuarAloc.nomUsuar} (${b.idUsuarAloc.dscEmailUsuar})`;
    }
    const u = usuariosList.find((x) => x._id === b.idUsuarAloc);
    if (u) return `${u.nomUsuar} (${u.dscEmailUsuar})`;
    return b.idUsuarAloc || "-";
  }

  function resolveVeiculo(b) {
    if (b.idVeicAloc && typeof b.idVeicAloc === "object") {
      return `${b.idVeicAloc.dscModelVeic || b.idVeicAloc.dscFabricVeic || "Veículo"}${
        b.idVeicAloc.dscPlacaVeic ? " - " + b.idVeicAloc.dscPlacaVeic : ""
      }`;
    }
    const v = veiculosList.find((x) => x._id === b.idVeicAloc);
    if (v)
      return `${v.dscModelVeic || v.dscFabricVeic || "Veículo"}${
        v.dscPlacaVeic ? " - " + v.dscPlacaVeic : ""
      }`;
    return b.idVeicAloc || "-";
  }

  function resolveMotorista(b) {
    if (
      b.idMotExclAloc &&
      typeof b.idMotExclAloc === "object" &&
      b.idMotExclAloc.nomUsuar
    ) {
      return b.idMotExclAloc.nomUsuar;
    }
    if (typeof b.idMotExclAloc === "string" && b.idMotExclAloc) {
      const u = usuariosList.find((x) => x._id === b.idMotExclAloc);
      return u ? u.nomUsuar : b.idMotExclAloc;
    }
    return "-";
  }

  function resolveLocal(b) {
    return b.dscLocalEstacAloc || b.dscLocalEstac || "-";
  }

  return (
    <div>
      <h2>Benefícios (alocação permanente)</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="form-grid">
        <label>Usuário beneficiado</label>
        <select
          value={form.idUsuarAloc}
          onChange={(e) => setForm({ ...form, idUsuarAloc: e.target.value })}
        >
          <option value="">Selecione...</option>
          {usuariosList.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nomUsuar} ({u.dscEmailUsuar})
            </option>
          ))}
        </select>

        <label>Veículo</label>
        <select
          value={form.idVeicAloc}
          onChange={(e) => setForm({ ...form, idVeicAloc: e.target.value })}
        >
          <option value="">Selecione...</option>
          {veiculosList.map((v) => (
            <option key={v._id} value={v._id}>
              {v.dscModelVeic || v.dscFabricVeic}{" "}
              {v.dscPlacaVeic ? `- ${v.dscPlacaVeic}` : ""}
            </option>
          ))}
        </select>

        <label>Motorista exclusivo</label>
        <select
          value={form.idMotExclAloc}
          onChange={(e) => setForm({ ...form, idMotExclAloc: e.target.value })}
        >
          <option value="">(nenhum)</option>
          {usuariosList.map((u) => (
            <option key={u._id} value={u._id}>
              {u.nomUsuar}
            </option>
          ))}
        </select>

        <label>Pode usar fim de semana?</label>
        <select
          value={form.indFdsAloc ? "sim" : "nao"}
          onChange={(e) =>
            setForm({ ...form, indFdsAloc: e.target.value === "sim" })
          }
        >
          <option value="nao">Não</option>
          <option value="sim">Sim</option>
        </select>

        <label>Local de estacionamento</label>
        <input
          value={form.dscLocalEstacAloc}
          onChange={(e) =>
            setForm({ ...form, dscLocalEstacAloc: e.target.value })
          }
          placeholder="Ex.: Garagem B - Vaga 12"
        />

        <label>Prioridade (0 = normal)</label>
        <input
          type="number"
          value={form.numPriorAloc}
          onChange={(e) =>
            setForm({ ...form, numPriorAloc: e.target.value })
          }
        />

        <label>Data início</label>
        <input
          type="datetime-local"
          value={form.datInicioAloc}
          onChange={(e) =>
            setForm({ ...form, datInicioAloc: e.target.value })
          }
        />

        <label>Data fim (opcional)</label>
        <input
          type="datetime-local"
          value={form.datFimAloc}
          onChange={(e) => setForm({ ...form, datFimAloc: e.target.value })}
        />

        <label>Justificativa</label>
        <textarea
          rows={2}
          value={form.dscJustfAloc}
          onChange={(e) => setForm({ ...form, dscJustfAloc: e.target.value })}
        />
      </div>

      {editId ? (
        <button onClick={handleUpdate} disabled={loading}>
          {loading ? "Salvando..." : "Atualizar benefício"}
        </button>
      ) : (
        <button onClick={handleCreate} disabled={loading}>
          {loading ? "Salvando..." : "Criar benefício"}
        </button>
      )}

      <h3>Alocações registradas</h3>
      <div className="table-list">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Veículo</th>
              <th>Motorista</th>
              <th>FDS</th>
              <th>Local estac.</th>
              <th>Prioridade</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {beneficios.map((b) => (
              <tr key={b._id}>
                <td>{resolveUsuario(b)}</td>
                <td>{resolveVeiculo(b)}</td>
                <td>{resolveMotorista(b)}</td>
                <td>{b.indFdsAloc ? "Sim" : "Não"}</td>
                <td>{resolveLocal(b)}</td>
                <td>{typeof b.numPriorAloc === "number" ? b.numPriorAloc : 0}</td>
                <td>
                  {b.datInicioAloc
                    ? new Date(b.datInicioAloc).toLocaleString()
                    : "-"}
                </td>
                <td>
                  {b.datFimAloc ? new Date(b.datFimAloc).toLocaleString() : "-"}
                </td>
                <td>{b.indStatAloc || "ativa"}</td>
                <td>
                  <button onClick={() => handleEdit(b)} disabled={!podeGerenciar}>
                    Editar
                  </button>
                  {b.indStatAloc !== "encerrada" && (
                    <button
                      onClick={() => handleEncerrar(b)}
                      disabled={!podeGerenciar}
                    >
                      Encerrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {beneficios.length === 0 && (
              <tr>
                <td colSpan={10}>Nenhuma alocação encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


  function DocumentosPage() {
    const [docs, setDocs] = useState([]);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
      idVeicDoc: "",
      dscTipoDoc: "crlv",
      dscPathDoc: "",
      datVencDoc: "",
    });

    async function loadDocs() {
      try {
        const data = await baseFetch("/documentos", {}, token);
        setDocs(data);
      } catch (e) {
        setError(e.message);
      }
    }

    useEffect(() => {
      if (token) loadDocs();
    }, [token]);

    async function handleCreate() {
      try {
        await baseFetch(
          "/documentos",
          { method: "POST", body: JSON.stringify(form) },
          token
        );
        await loadDocs();
        setForm({
          idVeicDoc: "",
          dscTipoDoc: "crlv",
          dscPathDoc: "",
          datVencDoc: "",
        });
      } catch (e) {
        setError(e.message);
      }
    }

    async function handleDelete(id) {
      if (!window.confirm("Excluir documento?")) return;
      try {
        await baseFetch(`/documentos/${id}`, { method: "DELETE" }, token);
        await loadDocs();
      } catch (e) {
        setError(e.message);
      }
    }

    return (
      <div>
        <h2>Documentos</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-grid">
          <label>Veículo</label>
          <select
            value={form.idVeicDoc}
            onChange={(e) => setForm({ ...form, idVeicDoc: e.target.value })}
          >
            <option value="">selecione...</option>
            {veiculosList.map((v) => (
              <option key={v._id} value={v._id}>
                {v.dscModelVeic} - {v.dscPlacaVeic}
              </option>
            ))}
          </select>
          <label>Tipo</label>
          <select
            value={form.dscTipoDoc}
            onChange={(e) => setForm({ ...form, dscTipoDoc: e.target.value })}
          >
            <option value="crlv">crlv</option>
            <option value="ipva">ipva</option>
            <option value="seguro">seguro</option>
            <option value="outro">outro</option>
          </select>
          <label>Path/Arquivo</label>
          <input
            value={form.dscPathDoc}
            onChange={(e) => setForm({ ...form, dscPathDoc: e.target.value })}
          />
          <label>Vencimento</label>
          <input
            type="date"
            value={form.datVencDoc}
            onChange={(e) => setForm({ ...form, datVencDoc: e.target.value })}
          />
        </div>
        <button onClick={handleCreate}>Cadastrar documento</button>

        <div className="table-list">
          <table>
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Path</th>
                <th>Venc.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d._id}>
                  <td>{d.idVeicDoc?.dscModelVeic || "-"}</td>
                  <td>{d.dscTipoDoc}</td>
                  <td>{d.dscPathDoc}</td>
                  <td>
                    {d.datVencDoc
                      ? new Date(d.datVencDoc).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(d._id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

function RelatoriosPage({ baseFetch, token }) {
  const [mesRef, setMesRef] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [error, setError] = useState("");

  const [cards, setCards] = useState({
    totalVeiculos: 0,
    veiculosDisponiveis: 0,
    reservasPendentes: 0,
    alocacoesAtivas: 0,
    custoPeriodo: 0,
  });

  const [utilizacao, setUtilizacao] = useState([]);
  const [custosDetalhados, setCustosDetalhados] = useState([]);
  const [sla, setSla] = useState(null);
  const [reservasStatus, setReservasStatus] = useState([]);
  const [veiculosStatus, setVeiculosStatus] = useState([]);
  const [topVeiculos, setTopVeiculos] = useState([]);
  const [custosPorTipo, setCustosPorTipo] = useState([]);
  const [reservasPorDia, setReservasPorDia] = useState([]);

  function getInicioFimDoMes(mesStr) {
    const [ano, mes] = mesStr.split("-").map(Number);
    const ini = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0);
    const pad = (n) => String(n).padStart(2, "0");
    return {
      ini: `${ano}-${pad(mes)}-${pad(1)}`,
      fim: `${ano}-${pad(mes)}-${pad(fim.getDate())}`,
    };
  }

  async function loadAll(selectedMes) {
    if (!token) return;
    const { ini, fim } = getInicioFimDoMes(selectedMes);
    setError("");

    try {
      const [
        cardsRes,
        utilRes,
        custosRes,
        slaRes,
        resStatusRes,
        veicStatusRes,
        topVeicRes,
        custoTipoRes,
        resPorDiaRes,
      ] = await Promise.all([
        baseFetch(`/relatorios/cards-resumo?ano_mes=${selectedMes}`, {}, token),
        baseFetch(`/relatorios/utilizacao?ano_mes=${selectedMes}`, {}, token),
        baseFetch(`/relatorios/custos?ini=${ini}&fim=${fim}`, {}, token),
        baseFetch(`/relatorios/sla?ini=${ini}&fim=${fim}`, {}, token),
        baseFetch(`/relatorios/reservas-status`, {}, token),
        baseFetch(`/relatorios/veiculos-status`, {}, token),
        baseFetch(`/relatorios/top-veiculos?ano_mes=${selectedMes}`, {}, token),
        baseFetch(`/relatorios/custos-por-tipo?ini=${ini}&fim=${fim}`, {}, token),
        baseFetch(`/relatorios/reservas-por-dia?ini=${ini}&fim=${fim}`, {}, token),
      ]);

      setCards(cardsRes || {});
      setUtilizacao(Array.isArray(utilRes) ? utilRes : []);
      setCustosDetalhados(Array.isArray(custosRes) ? custosRes : []);
      setSla(slaRes || null);
      setReservasStatus(Array.isArray(resStatusRes) ? resStatusRes : []);
      setVeiculosStatus(Array.isArray(veicStatusRes) ? veicStatusRes : []);
      setTopVeiculos(Array.isArray(topVeicRes) ? topVeicRes : []);
      setCustosPorTipo(Array.isArray(custoTipoRes) ? custoTipoRes : []);
      setReservasPorDia(Array.isArray(resPorDiaRes) ? resPorDiaRes : []);
    } catch (err) {
      console.error(err);
      setError(
        "Não deu pra carregar relatórios. Confere se o token é admin/gestor e se as rotas /api/v1/relatorios/... estão expostas."
      );
    }
  }

  useEffect(() => {
    if (token) loadAll(mesRef);
  }, [token, mesRef]);

  // helpers pra “gráficos”
  const maxUsoHoras = utilizacao.reduce(
    (acc, item) => Math.max(acc, item.totalHoras || 0),
    0
  );
  const maxCusto = custosPorTipo.reduce(
    (acc, item) => Math.max(acc, item.total || 0),
    0
  );
  const maxReservaDia = reservasPorDia.reduce(
    (acc, item) => Math.max(acc, item.total || 0),
    0
  );

  return (
    <div>
      <h2>Relatórios da frota</h2>

      <div className="rel-filter-row">
        <div>
          <label>Mês de referência</label>
          <input
            type="month"
            value={mesRef}
            onChange={(e) => setMesRef(e.target.value)}
          />
        </div>
        <p className="muted small">
          Todas as consultas usam esse mês. Se a rota não existir no backend, vai aparecer aviso.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* CARDS EM GRID */}
      <h3>Resumo</h3>
      <div className="rel-cards-grid">
        <div className="card">
          <span className="label">Veículos</span><br></br>
          <strong>{cards.totalVeiculos ?? 0}</strong>
        </div>
        <div className="card">
          <span className="label">Disponíveis</span><br></br>
          <strong>{cards.veiculosDisponiveis ?? 0}</strong>
        </div>
        <div className="card">
          <span className="label">Reservas pendentes</span><br></br>
          <strong>{cards.reservasPendentes ?? 0}</strong>
        </div>
        <div className="card">
          <span className="label">Alocações ativas</span><br></br>
          <strong>{cards.alocacoesAtivas ?? 0}</strong>
        </div>
        <div className="card">
          <span className="label">Custo total eventos</span><br></br>
          <strong>
            R$ {Number(cards.custoPeriodo || 0).toFixed(2)}
          </strong>
        </div>
      </div>

      {/* GRID PRINCIPAL: lado esquerdo (tabelas), lado direito (mini gráficos) */}
      <div className="rel-main-grid">
        {/* COLUNA ESQUERDA */}
        <div className="rel-col">
          {/* Utilização */}
          <h3>Utilização por veículo</h3>
          <div className="table-list">
            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Placa</th>
                  <th>Total horas</th>
                  <th>Total dias</th>
                  <th>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {utilizacao.length === 0 && (
                  <tr>
                    <td colSpan={5}>Nenhum dado de utilização.</td>
                  </tr>
                )}
                {utilizacao.map((u) => (
                  <tr key={u.veiculoId}>
                    <td>{u.modelo || u.fabricante || "-"}</td>
                    <td>{u.placa || "-"}</td>
                    <td>{u.totalHoras}</td>
                    <td>{u.totalDias}</td>
                    <td>{u.countReservas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custos detalhados */}
          <h3>Custos por tipo de evento e veículo</h3>
          <div className="table-list">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Veículo</th>
                  <th>Placa</th>
                  <th>Total (R$)</th>
                  <th>Eventos</th>
                  <th>Média (R$)</th>
                </tr>
              </thead>
              <tbody>
                {custosDetalhados.length === 0 && (
                  <tr>
                    <td colSpan={6}>Nenhum custo encontrado.</td>
                  </tr>
                )}
                {custosDetalhados.map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.tipo}</td>
                    <td>{c.modelo || c.fabricante || "-"}</td>
                    <td>{c.placa || "-"}</td>
                    <td>R$ {Number(c.totalValor).toFixed(2)}</td>
                    <td>{c.countEventos}</td>
                    <td>
                      {c.mediaValor
                        ? `R$ ${Number(c.mediaValor).toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reservas e veículos por status */}
          <div className="rel-two-cols">
            <div>
              <h3>Reservas por status</h3>
              <div className="table-list">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasStatus.length === 0 && (
                      <tr>
                        <td colSpan={2}>Nenhuma reserva.</td>
                      </tr>
                    )}
                    {reservasStatus.map((r) => (
                      <tr key={r.status}>
                        <td>{r.status}</td>
                        <td>{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3>Veículos por status</h3>
              <div className="table-list">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veiculosStatus.length === 0 && (
                      <tr>
                        <td colSpan={2}>Nenhum veículo.</td>
                      </tr>
                    )}
                    {veiculosStatus.map((v) => (
                      <tr key={v.status}>
                        <td>{v.status}</td>
                        <td>{v.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA – “GRÁFICOS” */}
        <div className="rel-col">
          {/* SLA */}
          <h3>SLA de aprovação</h3>
          <div className="rel-sla-cards">
            <div className="card small">
              <span className="label">Tempo médio (h)</span>
              <strong>{sla?.tempoMedioHoras ?? 0}</strong>
            </div>
            <div className="card small">
              <span className="label">Mínimo (h)</span>
              <strong>{sla?.tempoMinimoHoras ?? 0}</strong>
            </div>
            <div className="card small">
              <span className="label">Máximo (h)</span>
              <strong>{sla?.tempoMaximoHoras ?? 0}</strong>
            </div>
            <div className="card small">
              <span className="label">Aprovadas</span>
              <strong>{sla?.totalReservas ?? 0}</strong>
            </div>
          </div>

          {/* Top veículos barra */}
          <h3>Top veículos mais usados</h3>
          <div className="rel-chart-box">
            {topVeiculos.length === 0 && (
              <p className="muted small">Nenhum veículo no período.</p>
            )}
            {topVeiculos.map((v) => (
              <div key={v.veiculoId} className="rel-bar-row">
                <div className="rel-bar-label">
                  {v.modelo} {v.placa ? `- ${v.placa}` : ""}
                </div>
                <div className="rel-bar-track">
                  <div
                    className="rel-bar-fill"
                    style={{
                      width:
                        maxUsoHoras > 0
                          ? `${(v.totalHoras / maxUsoHoras) * 100}%`
                          : "5%",
                    }}
                  ></div>
                </div>
                <span className="rel-bar-value">{v.totalHoras}h</span>
              </div>
            ))}
          </div>

          {/* Custos por tipo barra */}
          <h3>Custos por tipo de evento (R$)</h3>
          <div className="rel-chart-box">
            {custosPorTipo.length === 0 && (
              <p className="muted small">Nenhum custo no período.</p>
            )}
            {custosPorTipo.map((c) => (
              <div key={c.tipo} className="rel-bar-row">
                <div className="rel-bar-label">{c.tipo}</div>
                <div className="rel-bar-track">
                  <div
                    className="rel-bar-fill alt"
                    style={{
                      width:
                        maxCusto > 0
                          ? `${(c.total / maxCusto) * 100}%`
                          : "5%",
                    }}
                  ></div>
                </div>
                <span className="rel-bar-value">
                  R$ {Number(c.total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Reservas por dia barra */}
          <h3>Reservas por dia</h3>
          <div className="rel-chart-box">
            {reservasPorDia.length === 0 && (
              <p className="muted small">Nenhuma reserva.</p>
            )}
            {reservasPorDia.map((r) => (
              <div key={r.dia} className="rel-bar-row">
                <div className="rel-bar-label">{r.dia}</div>
                <div className="rel-bar-track">
                  <div
                    className="rel-bar-fill slim"
                    style={{
                      width:
                        maxReservaDia > 0
                          ? `${(r.total / maxReservaDia) * 100}%`
                          : "5%",
                    }}
                  ></div>
                </div>
                <span className="rel-bar-value">{r.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


if (!token) {
  return (
    <LoginScreen
      handleLogin={handleLogin}
      handleSeedAdmin={handleSeedAdmin}
      globalError={globalError}
      API_BASE={API_BASE}
    />
  );
}


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Frota</h1>
        <p className="muted small">
          {currentUser?.nomUsuar} ({currentUser?.indPerfUsuar})
        </p>
        <nav>
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activePage === "usuarios" ? "active" : ""}
            onClick={() => setActivePage("usuarios")}
          >
            Usuários
          </button>
          <button
            className={activePage === "veiculos" ? "active" : ""}
            onClick={() => setActivePage("veiculos")}
          >
            Veículos
          </button>
          <button
            className={activePage === "reservas" ? "active" : ""}
            onClick={() => setActivePage("reservas")}
          >
            Reservas
          </button>
          <button
            className={activePage === "devolucoes" ? "active" : ""}
            onClick={() => setActivePage("devolucoes")}
          >
            Devoluções
          </button>
          <button
            className={activePage === "eventos" ? "active" : ""}
            onClick={() => setActivePage("eventos")}
          >
            Eventos
          </button>
          <button
            className={activePage === "beneficios" ? "active" : ""}
            onClick={() => setActivePage("beneficios")}
          >
            Benefícios
          </button>
          <button
            className={activePage === "documentos" ? "active" : ""}
            onClick={() => setActivePage("documentos")}
          >
            Documentos
          </button>
          <button
            className={activePage === "relatorios" ? "active" : ""}
            onClick={() => setActivePage("relatorios")}
          >
            Relatórios
          </button>
        </nav>
        <button
          className="logout-btn"
          onClick={() => {
            setToken("");
            setCurrentUser(null);
          }}
        >
          Sair
        </button>
      </aside>
      <main className="main">
        {activePage === "dashboard" && <Dashboard baseFetch={baseFetch} token={token} currentUser={currentUser} />}
        {activePage === "usuarios" && <UsuariosPage />}
        {activePage === "veiculos" && <VeiculosPage />}
        {activePage === "reservas" && <ReservasPage
                                          user={currentUser}
                                          usuariosList={usuariosList}
                                          veiculosList={veiculosList}
                                          baseFetch={baseFetch}
                                          token={token}
                                          refreshSharedLists={refreshSharedLists}
                                        />}
        {activePage === "devolucoes" && <DevolucoesPage
            baseFetch={baseFetch}
            token={token}
            user={currentUser}
          />}
        {activePage === "eventos" && <EventosPage
            baseFetch={baseFetch}
            token={token}
            user={currentUser}
            veiculosList={veiculosList}
            usuariosList={usuariosList}
          />}
        {activePage === "beneficios" &&  <BeneficiosPage
                                      user={currentUser}
                                      usuariosList={usuariosList}
                                      veiculosList={veiculosList}
                                      baseFetch={baseFetch}
                                      token={token}
                                    />}
        {activePage === "documentos" && <DocumentosPage />}
        {activePage === "relatorios" && <RelatoriosPage baseFetch={baseFetch} token={token} />}
      </main>
    </div>
  );
}

export default App;
