FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Run the dev server exposing it to the docker network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
