dev:
	deno run --watch=. --unstable-kv --allow-read --allow-write --allow-net src/index.jsx

deploy:
	source .secrets && deployctl deploy --project lionsmane --prod src/index.jsx
