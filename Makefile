
include .env

.PHONY: dev-run dev-compose himawari-backend himawari-frontend built-backend

dev-run: dev-compose himawari-backend himawari-frontend

dev-compose:
	docker-compose up -d

himawari-backend:
	yarn concurrently -c "blue,green" "yarn dev:server:tsc" "yarn dev:server:run"

himawari-frontend:
	BROWSER=none PORT=${FRONTEND_PORT} yarn dev:client

MODEL_SRC = $(shell find src/model/ -name '*.ts')
SERVER_ONLY_SRC = $(shell find src/server/ -name '*.ts')
SERVER_SRC += $(MODEL_SRC)
SERVER_SRC += $(SERVER_ONLY_SRC)
OUT_JS = $(patsubst src/%.ts,build_server/%.js,$(SERVER_SRC))

built-backend: $(OUT_JS)


$(OUT_JS): $(SERVER_SRC)
	yarn build:server

.PHONY: clean

clean:
	rm -rf ./build/ ./build_server/