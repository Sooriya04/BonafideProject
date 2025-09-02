FROM node:18

# Install LibreOffice + fonts + xvfb
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

# Use xvfb-run to run LibreOffice in headless mode
CMD ["xvfb-run", "--auto-servernum", "--server-args='-screen 0 1024x768x24'", "npm", "start"]
