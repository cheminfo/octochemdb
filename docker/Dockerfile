FROM node:18

RUN apt-get update && apt-get install -y vim

EXPOSE 80

WORKDIR /git

COPY . /git/docker

WORKDIR /git/docker
RUN npm ci --omit=dev && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

CMD npm run start

