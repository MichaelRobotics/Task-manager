# API Testing Script for 192.168.1.72

## Overview

This script (`test-api.js`) tests API endpoints on the KUKA system at `192.168.1.72:10870`, similar to the JavaScript code you provided.

## Current Status

✅ **Login works** - The `/api/login` endpoint successfully returns a JWT token  
⚠️ **AMR endpoints return 401** - The `/interfaces/api/amr/*` endpoints exist but return "login expired"

## Findings

1. **Login Endpoint**: `/api/login` works correctly
   - Returns JWT token in format: `{ success: true, data: { token: "..." } }`

2. **AMR Endpoints**: The following endpoints exist but require authentication:
   - `/interfaces/api/amr/containerQuery`
   - `/interfaces/api/amr/jobQuery`
   - `/interfaces/api/amr/submitMission`
   - `/interfaces/api/amr/containerIn`
   - `/interfaces/api/amr/containerOut`

3. **Authentication Issue**: 
   - Token is obtained successfully
   - But requests to AMR endpoints return "login expired"
   - This might indicate:
     - Token format issue
     - Token expiration time is very short
     - Different authentication method required
     - Plugin providing AMR endpoints needs to be started

## Usage

```bash
node test-api.js
```

## Configuration

Edit the script to change:
- IP address: `KM_RES_IP = '192.168.1.72'`
- Port: `PORT = 10870`
- Login credentials: `login(username, password)`

## Available Functions

- `login(username, password)` - Authenticate and get token
- `testContainerQuery()` - Test container query endpoint
- `testJobQuery(jobCode)` - Test job query endpoint
- `testSubmitMission()` - Test mission submission (commented out)
- `testContainerIn()` - Test container creation (commented out)
- `testContainerOut(containerCode)` - Test container removal
- `checkPlugins()` - List available plugins
- `testAlternativePaths()` - Test different endpoint paths

## Notes

The original JavaScript code you provided doesn't show authentication headers, which suggests:
1. The endpoints might be accessible without auth from browser context
2. Authentication might be handled at a different layer
3. The endpoints might be provided by a plugin that needs to be started

## Next Steps

1. Check if AMR plugin is started: Use `/api/plugin/listPlugins` endpoint
2. Verify token format: Check if server expects different header format
3. Check network access: The endpoints might only work from specific network locations
4. Review server logs: Check server-side logs for authentication errors

