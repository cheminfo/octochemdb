FROM node:10

RUN apt-get update && apt-get install -y cron git curlftpfs

# for debug purpose
RUN apt-get install -y vim

EXPOSE 80

WORKDIR /git

RUN git clone --branch promisify https://github.com/cheminfo/node-pubchem.git
COPY config.json /git/node-pubchem

WORKDIR /git/node-pubchem
RUN npm i && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

# Install the crotnab file for update in a clean way
COPY crontab /tmp/crontab
RUN crontab /tmp/crontab

#COPY on-tabs-config.json /on-tabs-config.json

COPY start.sh /start.sh
RUN chmod 744 /start.sh

CMD /start.sh

 