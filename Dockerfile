
# Stage 1: Build the Ionic Angular application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the project
COPY . .

# Build the web application
RUN npm run build

# Detect common Angular and Ionic build output folders
RUN set -eux; \
    mkdir -p /output; \
    if [ -f www/index.html ]; then \
      cp -a www/. /output/; \
    elif [ -f dist/index.html ]; then \
      cp -a dist/. /output/; \
    else \
      FOUND=""; \
      for f in dist/*/browser/index.html dist/*/index.html; do \
        if [ -f "$f" ]; then FOUND="$f"; break; fi; \
      done; \
      if [ -z "$FOUND" ]; then \
        echo "ERROR: Could not find index.html after build"; \
        exit 1; \
      fi; \
      DIR="${FOUND%/index.html}"; \
      cp -a "$DIR"/. /output/; \
    fi

# Stage 2: Serve the built web app
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /output/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
