# ビルド環境
FROM node:20-alpine as build

ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

WORKDIR /app
COPY package.json ./
COPY pnpm*.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build

# 本番環境
FROM node:20-alpine as production
WORKDIR /app
COPY package.json ./
COPY pnpm*.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# 環境変数
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# ポート3000でサーバーを起動
EXPOSE 3000
CMD ["pnpm", "start"]
