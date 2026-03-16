FROM ubuntu:22.04

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Update and install dependencies required to download, extract, and run node/prusa-slicer
RUN apt-get update && apt-get install -y \
  curl \
  unzip \
  libglu1-mesa \
  libgtk-3-0 \
  libgstreamer1.0-0 \
  libgstreamer-plugins-base1.0-0 \
  libxmu6 \
  libwebkit2gtk-4.0-37 \
  bzip2 \
  prusa-slicer \
  admesh \
  openscad \
  fonts-liberation \
  fontconfig \
  && rm -rf /var/lib/apt/lists/*

# Add custom fonts directory (required for SCAD font mounting)
RUN mkdir -p /app/fonts

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package.json ./

# Install npm packages
RUN npm install

# Copy application source
COPY server.js ./
COPY calc_3mf_volume.py ./

# Create uploads directory (for STLs) and outputs directory (for GCODEs)
RUN mkdir -p uploads outputs

# Expose the API port
EXPOSE 3005

# Start the Express server
CMD ["node", "server.js"]
