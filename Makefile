
include .env

.PHONY: dev-run dev-compose himawari-backend himawari-frontend

dev-run: dev-compose himawari-backend himawari-frontend

dev-compose:
	docker-compose up -d

himawari-backend:
	yarn dev:server

himawari-frontend:
	BROWSER=none PORT=${FRONTEND_PORT} yarn dev:client
