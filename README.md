## quick start

```
docker-compose up --build -d
```

By default the server will rebuild the full database. This process will take several days !


http://localhost:3001/mfs/em?em=203.235939


## Building and testing image

```
cd node-pubchem
docker build . --no-cache -t pubchem
docker run --privileged -i -t pubchem bash
``
