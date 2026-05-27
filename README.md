# OctoChemDB: A Comprehensive Web Service for Chemical Data Integration

[![DOI](https://www.zenodo.org/badge/134719303.svg)](https://www.zenodo.org/badge/latestdoi/134719303)

<img width="606" alt="image" src="https://user-images.githubusercontent.com/92425679/224554633-4c6e19fe-ed4f-4a16-8222-a540e55d10f8.png">

OctoChemDB is a web service with a two-step process: synchronization and aggregation. The synchronization phase uses plugins to create and maintain local copies of the synchronized databases, which are then linked in the aggregation phase based on their 2D structure. The resulting database can be queried with various criteria, and results are returned as a JSON object for integration into web applications.

We then provide an API that allows to search in the database quickly and efficiently. (Read more [here](#api))

## Workflow

Multiple plugin systems automatically import and update the local databases from the different [sources](#sources). The schema below summarizes the workflow:

![image](https://user-images.githubusercontent.com/92425679/205658491-6ba8a473-0c7e-461a-b409-f07180f9a471.png)

## Quick start

This project ships as a Docker image. Three deployment modes are provided as `compose.example.*.yaml` files at the repo root. Pick one, copy it to `compose.yaml`, copy `.env.example` to `.env`, and run `docker compose up -d`.

### Standard (port published on the host)

```bash
cp .env.example .env
cp compose.example.yaml compose.yaml
docker compose pull && docker compose up -d   # released image
# or, to build from this checkout:
docker compose up -d --build
```

The Fastify server listens on `${PORT:-11015}` (bound to `127.0.0.1`).

### Cloudflare Tunnel (public HTTPS, no port published)

```bash
cp .env.example .env
cp compose.example.cloudflared.yaml compose.yaml
docker compose up -d
```

In the Cloudflare dashboard (https://dash.cloudflare.com): **Networking → Tunnels → Create a tunnel → Cloudflared connector**, copy the token into `.env` as `TUNNEL_TOKEN=...`, then in the tunnel's **Published applications** tab add an application with **Service** `HTTP`, **URL** `octochemdb:11015`, and hostname `octochemdb.lactame.com`.

### Traefik (existing reverse proxy)

The host must already run Traefik on an external Docker network named `traefik` with a `websecure` entrypoint and a `letsencrypt` cert resolver.

```bash
cp .env.example .env
cp compose.example.traefik.yaml compose.yaml
docker compose up -d
```

The default hostname is `octochemdb.cheminfo.org` — adjust the `Host(...)` label in `compose.yaml` to your chosen hostname.

> By default the cron container will rebuild the full database. This process can take several days.

## Follow importation progress

```bash
docker compose logs --follow import
```

## Open mongo shell

```bash
docker compose exec mongo mongosh
```

The database name is `octochemdb`.

## Requirements

This project depends on [ocl-cache-docker](https://github.com/cheminfo/ocl-cache-docker); make sure it is available before bringing OctoChemDB up.

## Local development

Install dependencies and start the server with watch mode:

```bash
npm install
npm run dev
```

The server reads `PORT` from the environment (default 11015). For a local MongoDB, run `docker run --rm -p 27017:27017 --name mongo mongo:7` and set `MONGODB_URL=mongodb://localhost:27017` in `.env`.

## API

By default the server is available on `http://localhost:11015`.

Example: `http://localhost:11015/mfs/em?em=300`

## Setup environmental variables

The `.env.example` file lists every environment variable the service reads. Copy it to `.env` and adjust as needed; if mobile monitoring is desired the telegram variables should be set.

<!-- TABLE_GENERATE_START -->

| Variable                  | Function                                             |
| ------------------------- | ---------------------------------------------------- |
| MONGODB_URL               | URL to local mongoDB                                 |
| MONGO_DB_NAME             | Name of the mongo database                           |
| ORIGINAL_DATA_PATH        | Path where fetched data are stored                   |
| "NameDB"\_SOURCE          | Source for all databases fetched                     |
| PORT                      | Exposed port                                         |
| DEBUG_THROTTLING          | Time interval between each debug (in ms)             |
| TELEGRAM_BOT_ID           | Telegram BOT to send debug messages                  |
| TELEGRAM_CHAT_ID          | Telegram chat where debug messages are shown         |
| PLUGINS                   | List of plugins to be executed, if empty execute all |
| EXCLUDEPLUGINS            | List of plugins to not be executed                   |
| TUNNEL_TOKEN              | Cloudflare Tunnel token (cloudflared deployment)     |
| "NameDB"\_UPDATE_INTERVAL | The updating interval for each plugin (in days)      |

<!-- TABLE_GENERATE_END -->

## Sources

Here are listed the different sources used to fetch data. The list is not exhaustive and can be extended by adding a new plugin in the [plugins](./src/plugins/) folder.

<!-- TABLE_GENERATE_START -->

| Database        | Source                                |
| --------------- | ------------------------------------- |
| PubChem         | https://pubchem.ncbi.nlm.nih.gov/     |
| PubMed          | https://pubmed.ncbi.nlm.nih.gov/      |
| Lotus           | https://lotus.naturalproducts.net/    |
| Coconut         | https://coconut.naturalproducts.net/  |
| CMAUP           | https://bidd.group/CMAUP/             |
| GNPS            | https://gnps.ucsd.edu/                |
| NPASS           | https://bidd.group/NPASS/             |
| NP Atlas        | https://www.npatlas.org/              |
| MassBank        | https://massbank.eu/MassBank/         |
| USP Patents     | https://www.uspto.gov/                |
| NCBI Taxonomies | https://www.ncbi.nlm.nih.gov/taxonomy |

<!-- TABLE_GENERATE_END -->
