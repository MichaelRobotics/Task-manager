# Docker Setup Guide

This guide explains how to build and deploy the Next.js application using Docker.

## Files Created

1. **Dockerfile** - Multi-stage build for optimized production image
2. **.dockerignore** - Excludes unnecessary files from Docker context
3. **next.config.ts** - Updated with `output: 'standalone'` for Docker

## Building the Docker Image

### Basic Build
```bash
docker build -t task-manager:latest .
```

### Build with Tag for Registry
```bash
docker build -t ${REGISTRY_PATH}task-manager:${TAG} .
```

### Example
```bash
docker build -t registry.example.com/task-manager:v1.0.0 .
```

## Running the Container

### Basic Run
```bash
docker run -p 3001:3000 task-manager:latest
```

### Run with Environment Variables
```bash
docker run -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  task-manager:latest
```

## Docker Compose Configuration

Update your `docker-compose-new-container.yml` file:

1. **Update the port mapping** (line 78):
   ```yaml
   ports:
     - "3001:3000"  # External port 3001 maps to internal port 3000
   ```

2. **Update the image name** (line 8):
   ```yaml
   image: "${REGISTRY_PATH}task-manager:${TAG}"
   ```

3. **Update the container name** (line 9):
   ```yaml
   container_name: task-manager
   ```

4. **Update the log volume** (line 75):
   ```yaml
   volumes:
     - ${LOG_HOME}:/var/log/task-manager
   ```

## Dockerfile Features

### Multi-Stage Build
- **Stage 1 (deps)**: Installs dependencies only
- **Stage 2 (builder)**: Builds the Next.js application
- **Stage 3 (runner)**: Creates minimal production image

### Security
- Runs as non-root user (`nextjs`)
- Uses Alpine Linux for smaller image size
- Only includes necessary files in final image

### Optimization
- Uses Next.js standalone output for smaller image
- Leverages Docker layer caching
- Excludes development dependencies from final image

## Image Size Optimization

The Dockerfile uses Next.js standalone output, which:
- Only includes necessary files
- Reduces image size significantly
- Improves startup time

## Environment Variables

The application can use these environment variables:

- `NODE_ENV` - Set to `production` in Docker
- `PORT` - Server port (internal: 3000, external: 3001)
- `HOSTNAME` - Server hostname (default: 0.0.0.0)
- `NEXT_TELEMETRY_DISABLED` - Disables Next.js telemetry

## Troubleshooting

### Build Fails
- Ensure Node.js 20+ is available (handled by base image)
- Check that `package-lock.json` exists
- Verify all dependencies are listed in `package.json`

### Container Won't Start
- Check logs: `docker logs <container-name>`
- Verify port 3001 is not already in use (external port)
- Ensure environment variables are set correctly

### Large Image Size
- The standalone output should keep the image small
- Check that `.dockerignore` is working correctly
- Verify no unnecessary files are being copied

## Production Checklist

- [ ] Update docker-compose file with correct port (3001 external, 3000 internal)
- [ ] Update image name in docker-compose
- [ ] Set up proper logging volume path
- [ ] Configure environment variables
- [ ] Test the build locally
- [ ] Push image to registry
- [ ] Deploy using docker-compose


