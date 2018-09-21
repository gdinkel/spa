FROM node:10.6.0-alpine
WORKDIR /usr/src/spa
ADD . /usr/src/spa
RUN npm install
RUN chmod +x /usr/src/spa/wait-for.sh
RUN cp docker-server-entrypoint.sh /usr/local/bin/ && \
chmod +x /usr/local/bin/docker-server-entrypoint.sh
ENTRYPOINT [ "/usr/local/bin/docker-server-entrypoint.sh" ]