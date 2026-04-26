FROM node:22-alpine

WORKDIR /app

# Use pnpm from Corepack (ships with Node 22)
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "start"]
