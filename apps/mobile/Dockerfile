FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/mobile ./apps/mobile

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/mobile

EXPOSE 8081 19000 19001 19002

CMD ["pnpm", "dev", "--", "--host", "lan"]
