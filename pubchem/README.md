# Local development

Better if you have docker installed and create the 2 following aliases:

- `alias mongod="docker container rm mongod; docker run --name mongod -p 27017:27017 mongo"`
- `alias mongo="docker exec -it mongod mongo"`

You can then easily create a new install of mongod

# node-pubchem

In this project we make a copy of multiple databases and carefully calculate the monoisotopic mass of each of the molecule as well as the molecular formula taking into account charges, parts and isotopes.

We then provide an API that allows to search in the database quickly and efficiently. (Read more [here](../README.md))

# Workflow

Multiple plugins systems automatic import and update the local databases from the different [sources](../README.md#sources). The schema bellow summarizes the workflow:

![image](https://user-images.githubusercontent.com/92425679/205658491-6ba8a473-0c7e-461a-b409-f07180f9a471.png)

# Setup environmental variables

The file [env.example](./.env.exemple) contains different type of variables (see table below). This file should be renamed ".env" and if a mobile monitoring is desired, the telegram variables should be defined.

<!-- TABLE_GENERATE_START -->

| Variable                | Function                                             |
| ----------------------- | ---------------------------------------------------- |
| MONGODB_URL             | URL to local mongoDB                                 |
| MONGO_DB_NAME           | Name of the mongo database                           |
| ORIGINAL_DATA_PATH      | Path where fetched data are stored                   |
| "NameDB"\_SOURCE        | Source for all databases fetched                     |
| PORT                    | Exposed port                                         |
| DEBUG_THROTTLING        | Time interval between each debug (in ms)             |
| TELEGRAM_BOT_ID         | Telegram BOT to send debug messages                  |
| TELEGRAM_CHAT_ID        | Telegram chat where debug messages are shown         |
| PLUGINS                 | List of plugins to be executed, if empty execute all |
| EXCLUDEPLUGINS          | List of plugins to not be executed                   |
| "NameDB"\_DATE_INTERVAL | The updating interval for each plugin (in days)      |

<!-- TABLE_GENERATE_END -->
