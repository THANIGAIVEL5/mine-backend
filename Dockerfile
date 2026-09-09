FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --build-from-source sqlite3
RUN npm install

COPY . .

EXPOSE 3000
ENV PORT=3000

CMD [ "npm", "start" ]

