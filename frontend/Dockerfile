# --- Stage 1: Build the React App ---
FROM node:18-alpine AS build

WORKDIR /app

# 1. Copy ALL dependency-related files first
COPY package*.json ./
COPY tsconfig.json .
COPY tailwind.config.js .
COPY postcss.config.js .

# 2. Install dependencies (including recharts)
RUN npm install --frozen-lockfile

# 3. Copy the rest of the files
COPY . .

# 4. Build the production-ready static files
RUN npm run build


# --- Stage 2: Serve with Nginx ---
FROM nginx:stable-alpine

# Copy the built static files from the 'build' stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]