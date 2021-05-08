all: static/himawari.js

static/himawari.js: src/lib.rs
	wasm-pack build --target web --out-name himawari --out-dir static

.PHONY: clean

clean:
	rm -f static/himawari*.js static/himawari*.ts static/*wasm* static/.gitignore static/package.json