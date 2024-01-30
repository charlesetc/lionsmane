dev:
	npx wrangler dev ./src/index.jsx --port 8000

deploy:
	npx wrangler deploy --assets dist
