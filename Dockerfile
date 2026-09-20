# Use official Node.js LTS image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the React frontend
RUN npm run build

# Use a new stage for the production image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy backend package files
COPY server/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY server/ ./

# Copy built frontend files
COPY --from=build /usr/src/app/build ./public

# Expose the port (ensure this matches your server's port)
EXPOSE 5000

# Healthcheck for container (optional, adjust path as needed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Start the backend server
CMD ["node", "server.js"]
