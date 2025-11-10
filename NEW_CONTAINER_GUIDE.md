# Guide: Adding a New Container to Communicate with APIs

## Option 1: Separate Docker Compose File (Recommended for Independent Deployment)

### Advantages:
- ✅ Can be deployed/updated independently
- ✅ Doesn't require modifying the main docker-compose.yml
- ✅ Easier to manage separately
- ✅ Can be version controlled separately

### How to Use:

1. **Use the provided template**: `docker-compose-new-container.yml`

2. **Customize the environment variables** - Remove the ones you don't need, keep only what your container requires

3. **Deploy it**:
   ```bash
   # Make sure the main services are running first
   cd /opt/server
   docker-compose up -d
   
   # Then deploy your new container
   docker-compose -f docker-compose-new-container.yml up -d
   ```

4. **The container will automatically connect** to the `server` network and can communicate with all API services using their service names as hostnames.

---

## Option 2: Add to Existing Docker Compose File

### Advantages:
- ✅ Everything in one place
- ✅ Can use `depends_on` with health checks
- ✅ Single command to manage all services

### How to Add:

Add your service definition before the `volumes:` section (around line 835):

```yaml
   your-new-container:
      image: "${REGISTRY_PATH}your-image:${TAG}"
      container_name: your-new-container
      restart: always
      networks:
         server:
            aliases:
               - your-new-container  # Optional: if you want an alias
      environment:
         # Add only the variables you need
         BASIC_DATA_HOST: krcs-basic-data
         BASIC_DATA_HTTP_PORT: 7888
         BASIC_DATA_GRPC_PORT: 7999
         # ... add other services as needed
      volumes:
         - ${LOG_HOME}:/var/log/your-app
      ports:
         - "YOUR_PORT:YOUR_PORT"
      depends_on:
         krcs-basic-data:
            condition: service_healthy
```

Then deploy:
```bash
docker-compose up -d your-new-container
```

---

## Important Notes:

### Network Communication:
- **Service names are hostnames**: Use `krcs-basic-data`, `kwcs-engine`, etc. as hostnames
- **Ports are internal**: Use the internal ports (e.g., `7888` for HTTP, `7999` for gRPC)
- **No need for IP addresses**: Docker Compose DNS handles name resolution

### Environment Variables:
- **Only include what you need**: Remove unused variables to keep it clean
- **HTTP vs gRPC**: Choose the protocol your container uses
- **Common pattern**: Most services use `SERVICE_NAME_HOST` and `SERVICE_NAME_PORT`

### Example Minimal Configuration:
If you only need to communicate with `krcs-basic-data`:

```yaml
environment:
   BASIC_DATA_HOST: krcs-basic-data
   BASIC_DATA_HTTP_PORT: 7888
   BASIC_DATA_GRPC_PORT: 7999
```

---

## Testing Connection:

Once deployed, test from inside your container:

```bash
# Test HTTP endpoint
docker exec your-new-container wget -O- http://krcs-basic-data:7888/swagger-ui/

# Test if service is reachable
docker exec your-new-container ping krcs-basic-data

# Check network connectivity
docker exec your-new-container nslookup krcs-basic-data
```

---

## Troubleshooting:

1. **Container can't reach APIs**:
   - Verify it's on the `server` network: `docker network inspect server`
   - Check service names match exactly (case-sensitive)

2. **Connection refused**:
   - Ensure the API service is running: `docker-compose ps`
   - Check if you're using the correct port (HTTP vs gRPC)

3. **DNS resolution fails**:
   - Make sure both containers are on the same network
   - Restart your container after network changes

