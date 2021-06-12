
include .env

.PHONY: dev-run built-backend himawari-frontend himawari-backend

dev-run:
	docker-compose up -d
	yarn concurrently -c "blue,green,yellow" -n "himawari,client" "make himawari-backend" "make himawari-frontend"

himawari-frontend:
	BROWSER=none PORT=${FRONTEND_PORT} yarn dev:client

himawari-backend:
	cd himawari/ && cargo watch -x run


.PHONY: clean

clean:
	rm -rf ./build/