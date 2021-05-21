
include .env

.PHONY: dev-run dev-compose himawari-backend himawari-frontend

dev-run: dev-compose himawari-backend himawari-frontend

dev-compose:
	docker-compose up -d

himawari-backend:
	cargo run

himawari-frontend:
	cd himawari-client && BROWSER=none PORT=${FRONTEND_PORT} yarn dev:client
