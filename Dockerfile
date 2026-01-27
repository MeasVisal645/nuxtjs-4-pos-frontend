# Use a Node.js image for building
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json before running npm ci (better caching)
COPY package.json package-lock.json ./

# Install dependencies using npm ci for a clean and reproducible install
RUN npm ci

# Copy the entire project to the container
COPY . .

# Build the project
RUN npm run build

# Use a lightweight image for production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install only production dependencies
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built files from builder
COPY --from=builder /app/.output .output

# Expose the application port
EXPOSE 3000

# Start the Nuxt.js application
CMD ["node", ".output/server/index.mjs"]
