FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install OpenSCAD and dependencies
RUN apt-get update && apt-get install -y \
  curl \
  openscad \
  fonts-liberation \
  fontconfig \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy application source
COPY server.js ./

# Create output directory
RUN mkdir -p outputs

# Expose the API port
EXPOSE 3006

# Start the server
CMD ["node", "server.js"]
