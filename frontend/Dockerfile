FROM node:22-alpine

# 1. diretório de trabalho dentro do container
WORKDIR /app

# 2. copia só os manifests primeiro (melhor cache)
COPY frota-web/package*.json ./ 

# 3. instala deps
RUN npm install

# 4. copia o resto do código
COPY frota-web/. .

# 5. expõe a porta do Vite
EXPOSE 5173

# 6. sobe o Vite ouvindo fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
