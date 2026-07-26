FROM node:24-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S modiqueps && adduser -S modiqueps -G modiqueps

COPY --from=dependencies --chown=modiqueps:modiqueps /app/node_modules ./node_modules
COPY --chown=modiqueps:modiqueps package.json ./
COPY --chown=modiqueps:modiqueps src ./src

USER modiqueps
CMD ["node", "./src/index.js"]
