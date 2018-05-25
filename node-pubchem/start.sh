mkdir -p /pubchem-data
curlftpfs ftp.ncbi.nlm.nih.gov /pubchem-data

cd /git/node-pubchem

node src/sync/firstImport.js &


npm run server
