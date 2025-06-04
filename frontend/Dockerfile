FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install && npm install -g serve

COPY . .
ARG SERVER_PORT
ARG SERVER_URL
ENV REACT_APP_SERVER_PORT=${SERVER_PORT}
ENV REACT_APP_API_URL=${SERVER_URL}

RUN npm run build

EXPOSE 3000 

CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]