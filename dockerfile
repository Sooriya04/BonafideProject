# Use official Node.js image
FROM node:18

# Install LibreOffice, fonts, and xvfb for headless PDF conversion
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose port (Render injects PORT via environment variable)
EXPOSE 3000

# Run the app in headless mode using xvfb-run
# Note: --server-args should not have quotes inside JSON array
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1024x768x24", "npm", "start"]
