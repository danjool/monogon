FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Install dependencies for wat subapp
COPY public/wat/package.json ./public/wat/
RUN cd public/wat && npm install --omit=dev

COPY . .
EXPOSE 3000
CMD ["npm", "start"]