
FROM node:22-alpine

WORKDIR /app

RUN npm install -g @ionic/cli

COPY package*.json ./

RUN npm install

COPY . .

# Disable Angular persistent cache
RUN npx ng cache disable

# Expose Ionic port
EXPOSE 8100

# Start Ionic server
CMD ["ionic", "serve", "--host=0.0.0.0", "--port=8100", "--no-open"]
