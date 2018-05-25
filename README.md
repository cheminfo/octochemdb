
## Building and testing image

```
cd node-pubchem
docker build . -t pubchem
docker run --privileged -i -t pubchem bash
```