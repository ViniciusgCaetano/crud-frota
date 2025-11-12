FROM node:22-alpine

# diretório de trabalho dentro do container
WORKDIR /usr/src/app

# copiar package primeiro pra aproveitar cache
COPY package*.json ./

# instalar dependências
RUN npm install --production

# copiar o resto do código
COPY . .

# expõe a porta do server.js
EXPOSE 3000

# variáveis padrão (podem ser sobrescritas no compose)
ENV NODE_ENV=production

CMD ["node", "server.js"]
