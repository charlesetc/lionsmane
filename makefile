dev:
	deno run --watch=. --unstable-kv --allow-read --allow-write --allow-net src/index.jsx

repl:
	source .secrets && deno repl --unstable-kv --allow-read --allow-write --allow-net --allow-env

deploy:
	source .secrets && deployctl deploy --project lionsmane --prod src/index.jsx

test:
	deno test --unstable-kv src/kv.js
