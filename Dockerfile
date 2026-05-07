FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY next.config.js postcss.config.js tailwind.config.js tsconfig.json next-env.d.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
