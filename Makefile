

.PHONY: dev-run dev-compose himawari-backend himawari-frontend

dev-run: dev-compose himawari-backend himawari-frontend

dev-compose:
	docker-compose up -d

himawari-backend:
	cargo run --bin himawari --target x86_64-unknown-linux-musl

himawari-frontend:
	cd frontend && BROWSER=none yarn start
