dev:
	deno task start

deploy:
	source .secrets && deployctl deploy --project cardamom --prod src/index.jsx
