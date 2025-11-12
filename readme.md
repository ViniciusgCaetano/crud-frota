# Sistema de Gestão de Frota

Aplicação feita para gerenciar **veículos, reservas, devoluções, eventos, benefícios (alocação permanente)**, documentos e **relatórios** de uso da frota. O projeto ficou dividido em **backend (Node + Express + MongoDB)** e **frontend (React + Vite)**, com opção de rodar via Docker.

---

## 1. Pré-requisitos

* **Docker** e **Docker Compose**

---

## 2. Estrutura do projeto

```text
.
├── backend/               # API REST (Node, Express, Mongoose)
│   ├── server.js
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── frota-web/         # app React (Vite)
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml     # (opcional) para subir tudo junto
```

* **backend**: expõe a API em `/api/v1/...`
* **frontend**: consome essa API e faz todo o CRUD, com login e bloqueio de telas
* tudo foi pensado pra usar **URL e API_KEY hardcoded no front**

---

## 3. Backend

### 3.1. Instalação

```bash
cd backend
npm install
```

### 3.2. Variáveis de ambiente

Crie um `.env` dentro de `backend/` com algo assim:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/frotaVeiculos
JWT_SECRET=devsecret
API_KEY=123456
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development
```

* **API_KEY**: o backend exige `x-api-key` no header pra tudo que é `/api/...`
* **ALLOWED_ORIGINS**: precisa ter o endereço do front

### 3.3. Rodar manualmente

```bash
npm start
# ou
node server.js
```

A API sobe em: **[http://localhost:3000](http://localhost:3000)**

### 3.4. Rotas principais

* `POST /api/v1/auth/login` – login com e-mail e senha (senha não é enviada hasheada)
* `POST /api/v1/auth/seed-admin` – cria o primeiro admin (`admin@empresa.com` / `admin123`)
* `GET /api/v1/usuarios` – lista usuários (apenas autenticado)
* `POST /api/v1/usuarios` – cria usuário (apenas admin)
* `GET /api/v1/veiculos` / `POST /api/v1/veiculos`
* `GET /api/v1/reservas` / `POST /api/v1/reservas` / `POST /api/v1/reservas/:id/aprovar` / `.../rejeitar` / `.../cancelar`
* `GET /api/v1/devolucoes` / `POST /api/v1/devolucoes`
* `GET /api/v1/eventos` / `POST /api/v1/eventos`
* `GET /api/v1/beneficios` / `POST /api/v1/beneficios` / `POST /api/v1/beneficios/:id/encerrar`
* `GET /api/v1/relatorios/...` – várias rotas de relatório (utilização, custos, SLA, cards, reservas por dia, etc.)

---

## 4. Frontend

### 4.1. Instalação

```bash
cd frontend
npm install
# ou, se o app estiver dentro de /frontend/frota-web:
cd frontend/frota-web
npm install
```

### 4.2. Rodar manualmente

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

O front vai ficar em: **[http://localhost:5173](http://localhost:5173)**

### 4.3. O que o front faz

* tela de **login** (chama `/auth/login` e depois `/auth/validar`)
* guarda **token** e **usuário completo** (incluindo supervisor)
* todas as telas são **bloqueadas se não estiver logado**
* telas com **dropdown** para todos os campos que precisam de `id` (usuário, veículo, reserva…)
* CRUD completo de:

  * usuários
  * veículos (com tipo, opcionais, status)
  * reservas (já preenche solicitante e supervisor do usuário logado)
  * devoluções (só mostra reservas não concluídas)
  * eventos do veículo
  * benefícios / alocação permanente
  * documentos
  * relatórios (várias chamadas novas)
* dashboard simples (visão geral)

---

## 5. Tecnologias empregadas

* **Backend**

  * Node.js 22
  * Express
  * Mongoose (MongoDB)
  * JWT para autenticação
  * Middleware de autorização por perfil (`admin`, `gestor_frota`, `supervisor`, `solicitante`)
  * Auditoria (coleção própria)
  * CORS configurado
  * API Key (`x-api-key`)

* **Frontend**

  * React + Vite
  * Hooks (`useState`, `useEffect`)
  * layout simples em CSS
  * proteção de rota por token
  * dropdowns alimentados pela API
  * telas de relatório consumindo várias rotas

* **Infra / Dev**

  * Docker / docker-compose
  * Git (atenção: pasta backend tinha .git próprio e foi “achatada”)

---

## 7. Prompts de IA usados na construção

O projeto foi desenvolvido iterativamente com o apoio de IA, pedindo alteração e sugestões de melhoria para models Mongoose, controllers REST, telas React com dropdowns, adaptação de login, rotas de relatório agregadas e arquivos de Docker.


1. **“Monte um arquivo de requisitos para o estudo de caso de frota”**

   * Isso auxiliou o grupo a entender o que era necessário e montar a EAP para a construção do trabalho
   
2. **“Substitua campos de ID por dropdown no front”**

   * Ajustou o React para buscar listas e preencher `<select>`.
3. **“Quero CRUD completo de todos os recursos”**

   * Forçou criação de rotas `GET/POST/PUT/DELETE` e telas correspondentes.
4. **“Faça o login aceitar senha normal e não hasheada no front”**

   * Ajustou o controller de auth pra comparar hash no back.
5. **“Use todas as rotas no front”**

   * Gerou telas de eventos, devolução, benefícios, relatórios.
6. **“Relatórios com novas rotas (cards, top veículos, custos por tipo, reservas por dia)”**

   * Pediu novas agregações no controller.
7. **“Dockerizar o projeto”**

   * Gerou Dockerfile do front e sugestão do back.
8. **“Transformar pasta que era git separado em uma só”**

   * Gerou os comandos `git rm --cached backend` e remover `.git` interno.
9. **“Gerar script SQL equivalente aos models”**

   * Mapear coleções Mongo para tabelas MySQL.

Se quiser colocar no README algo mais enxuto, dá pra resumir em:

---

## 8. Como rodar do zero (passo-a-passo)

1. Suba o **MongoDB**:

   * local: só iniciar o serviço
   * ou: `docker run -d -p 27017:27017 mongo:7`
2. Vá para o backend:

   ```bash
   cd backend
   cp .env.example .env   # se existir
   npm install
   npm start
   ```
3. Crie o admin:

   * `POST http://localhost:3000/api/v1/auth/seed-admin`
     (pode chamar no front, tem botão)
4. Vá para o frontend:

   ```bash
   cd frontend/frota-web
   npm install
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
5. Acesse em **[http://localhost:5173](http://localhost:5173)**

   * login: `admin@empresa.com`
   * senha: `admin123`