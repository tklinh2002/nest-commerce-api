# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package management files first to leverage Docker cache
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (using legacy-peer-deps to avoid NestJS 12 conflicts)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build the NestJS application
RUN npm run contract:emit
RUN npm run build


# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Only install production dependencies to keep the image lightweight
RUN npm install --legacy-peer-deps --production

# Copy the compiled artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
