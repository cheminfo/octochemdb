# OctoChemDB: A Comprehensive Web Service for Chemical Data Integration

[![DOI](https://www.zenodo.org/badge/134719303.svg)](https://www.zenodo.org/badge/latestdoi/134719303)

<img width="606" alt="image" src="https://user-images.githubusercontent.com/92425679/224554633-4c6e19fe-ed4f-4a16-8222-a540e55d10f8.png">

OctoChemDB is a web service with a two-step process: synchronization and aggregation. The synchronization phase uses plugins to create and maintain local copies of the synchronized databases, which are then linked in the aggregation phase based on their 2D structure. The resulting database can be queried with various criteria, and results are returned as a JSON object for integration into web application.

We then provide an API that allows to search in the database quickly and efficiently. (Read more [here](#api))

## Workflow

Multiple plugins systems automatic import and update the local databases from the different [sources](../README.md#sources). The schema bellow summarizes the workflow:

![image](https://user-images.githubusercontent.com/92425679/205658491-6ba8a473-0c7e-461a-b409-f07180f9a471.png)

## Quick start

```
docker-compose up --build -d
```

By default the server will rebuild the full database. This process will take several days !

## Follow importation progress

```
docker-compose logs --follow import
```

## Open mongo shell

```
docker-compose exec mongo-mongo
```

The database name is: `octochemdb`

## Requirements

This project depends on [ocl-cache-docker](https://github.com/cheminfo/ocl-cache-docker), please be sure to build it before start using OctoChemDB.

## Local development

Better if you have docker installed and create the 2 following aliases:

- `alias mongod="docker container rm mongod; docker run --name mongod -p 27017:27017 mongo"`
- `alias mongo="docker exec -it mongod mongo"`

You can then easily create a new install of mongod

## API

By default the server is available on port 3001

http://localhost:3001/mfs/em?em=300

## Setup environmental variables

The file "env.example" contains different type of variables (see table below). This file should be renamed ".env" and if a mobile monitoring is desired, the telegram variables should be defined.

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
| "NameDB"\_UPDATE_INTERVAL | The updating interval for each plugin (in days)      |

<!-- TABLE_GENERATE_END -->

## Sources

Here are listed the different sources that are used to fetch data. The list is not exhaustive and can be updated by adding a new plugin in the [plugins](./docker/src/plugins/) folder.

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
