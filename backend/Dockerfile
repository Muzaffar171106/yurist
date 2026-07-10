FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
COPY knowledge_base ./knowledge_base
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 5050
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5050/api/health || exit 1
CMD ["node", "src/server.js"]
