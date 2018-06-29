FROM node:10

RUN apt-get update && apt-get install -y cron git curlftpfs

# for debug purpose
RUN apt-get install -y vim

EXPOSE 80

WORKDIR /git

RUN git clone https://github.com/cheminfo/node-pubchem.git
COPY config.json /git/node-pubchem

WORKDIR /git/node-pubchem
RUN npm i && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

#COPY on-tabs-config.json /on-tabs-config.json

CMD npm run server

