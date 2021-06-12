
include .env

.PHONY: dev-run built-backend himawari-frontend himawari-backend

dev-run:
	docker-compose up -d
	yarn concurrently -c "blue,green,yellow" -n "tsc,himawari,client" "yarn dev:server:tsc" "yarn dev:server:run" "make himawari-frontend"

himawari-frontend:
	BROWSER=none PORT=${FRONTEND_PORT} yarn dev:client

himawari-backend:


.PHONY: clean

clean:
	rm -rf ./build/