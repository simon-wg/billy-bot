FROM oven/bun AS base
WORKDIR /usr/src/app

FROM base AS install
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /tmp/dev
COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev && bun install --frozen-lockfile

RUN mkdir -p /tmp/prod
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /tmp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun test
RUN bun run build

FROM base AS release
COPY --from=install /tmp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist/index.js .
COPY --from=prerelease /usr/src/app/package.json .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "start"]