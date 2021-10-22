FROM node:16

EXPOSE 80

WORKDIR /git

COPY . /git/pubchem

WORKDIR /git/pubchem
RUN npm i --production && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

CMD npm run start

