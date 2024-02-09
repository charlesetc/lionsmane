dev:
	deno run --unstable-kv --allow-read --allow-net src/index.jsx

deploy:
	source .secrets && deployctl deploy --project cardamom --prod src/index.jsx
