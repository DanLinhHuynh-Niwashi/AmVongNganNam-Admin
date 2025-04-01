FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG SERVER_PORT
ARG SERVER_URL
ENV REACT_APP_SERVER_PORT=${SERVER_PORT}
ENV REACT_APP_API_URL=${SERVER_URL}

EXPOSE 3000 

CMD ["npm", "start"]
