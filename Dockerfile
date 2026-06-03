FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY . .
RUN node -e "require.resolve('dotenv')"

EXPOSE 8090

CMD ["npm", "start"]
