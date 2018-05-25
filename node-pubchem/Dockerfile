FROM node:8-slim

RUN apt-get update && apt-get install -y cron git curlftpfs
EXPOSE 80

WORKDIR /git

RUN git clone https://github.com/cheminfo/node-pubchem.git
COPY config.json /git/node-pubchem

WORKDIR /git/node-pubchem
RUN npm i && rm -rf /root/.npm /usr/local/share/.cache /root/.cache

COPY crontab /etc/cron.d/nodepubchem
RUN chmod 744 /etc/cron.d/nodepubchem
RUN touch /var/log/cron.log

#COPY on-tabs-config.json /on-tabs-config.json

COPY start.sh /start.sh
RUN chmod 744 /start.sh

CMD /start.sh

 