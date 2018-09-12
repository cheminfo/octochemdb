FROM node:10

RUN apt-get update && apt-get install -y git 

EXPOSE 80

WORKDIR /git

COPY src /git/node-pubchem
COPY config.json /git/node-pubchem

WORKDIR /git/node-pubchem
RUN npm i --production && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

CMD npm run server

