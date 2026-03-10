# Containerized Node.js App with Docker Compose

Node.js backend containerized with MongoDB and Redis using Docker Compose.

## Tech Stack

- Node.js
- Docker
- Docker Compose
- MongoDB
- Redis

## Project Structure

```
node-devops-project
+-- app.js
+-- package.json
+-- package-lock.json
+-- Dockerfile
+-- docker-compose.yml
+-- .env
+-- .env.example
+-- README.md
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
PORT=8090
MONGO_URI=mongodb://mongo:27017/devopsdb
REDIS_HOST=redis
REDIS_PORT=6379
```

## Run Project

```
docker compose up --build
```

To stop:

```
docker compose down
```

## Verification

Check containers and health:

```
docker compose ps
```

Verify endpoints:

```
curl http://localhost:8090/
curl http://localhost:8090/health
```

## Application URL

```
http://localhost:8090
```

## Endpoints

- `GET /` -> application running
- `GET /health` -> health check (MongoDB + Redis status)

## Notes

- MongoDB data is persisted in the `mongo_data` volume.
- Service discovery uses Compose service names (`mongo`, `redis`).
- Health checks are enabled for all services.
- Dockerfile uses a multi-stage build and Alpine base for smaller images.
- Logging is capped via `json-file` options.