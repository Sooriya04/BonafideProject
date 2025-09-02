FROM node:18

RUN apt-get update && apt-get install -y \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-common \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    fonts-dejavu \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/lib/libreoffice/program/soffice /usr/bin/soffice

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000


CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1024x768x24", "npm", "start"]
