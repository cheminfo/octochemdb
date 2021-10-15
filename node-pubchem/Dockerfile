FROM node:16

EXPOSE 80

WORKDIR /git

COPY src /git/node-pubchem

WORKDIR /git/node-pubchem
RUN npm i --production && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

CMD npm run start

