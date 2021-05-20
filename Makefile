
# env file must be specified to use Makefile
include .env

.PHONY: dev-run dev-compose run-himawari-backend run-himawari-frontend himawari-frontend

dev-run: dev-compose run-himawari-backend run-himawari-frontend

dev-compose:
	docker-compose up -d

run-himawari-backend:
	#cd himawari-backend && yarn start

run-himawari-frontend: himawari-frontend
	cd himawari-client && BROWSER=none PORT=$FRONTEND_PORT yarn start

himawari-frontend: himawari-model

himawari-model/build/index.js: $(wildcard himawari-model/src/*.ts)
	cd himawari-model && yarn build