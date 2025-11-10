# Authorization Instructions for New Container

## Overview

This guide explains how to implement authentication/authorization in your new container to work seamlessly with the existing KUKA fleet management system.

## Architecture

- **Authorization Service**: `krcs-basic-data:7888`
- **Authentication Method**: JWT (JSON Web Tokens)
- **Token Format**: `Bearer <jwt_token>`
- **Validation**: Token is validated via authorization service or locally

---

## Docker Compose Configuration

Your `docker-compose-new-container.yml` should include:

```yaml
environment:
   # Authorization Service (REQUIRED)
   AUTHORIZATION_HOST: krcs-basic-data
   AUTHORIZATION_PORT: 7888
   
   # Other service endpoints...
   BASIC_DATA_HOST: krcs-basic-data
   BASIC_DATA_HTTP_PORT: 7888
   # ... etc
```

---

## TypeScript Implementation

### 1. Environment Variables Interface

```typescript
interface AuthConfig {
  authorizationHost: string;
  authorizationPort: string;
  basicDataHost: string;
  basicDataHttpPort: string;
}

function getAuthConfig(): AuthConfig {
  return {
    authorizationHost: process.env.AUTHORIZATION_HOST || 'krcs-basic-data',
    authorizationPort: process.env.AUTHORIZATION_PORT || '7888',
    basicDataHost: process.env.BASIC_DATA_HOST || 'krcs-basic-data',
    basicDataHttpPort: process.env.BASIC_DATA_HTTP_PORT || '7888',
  };
}
```

### 2. JWT Token Validation Service

```typescript
import axios, { AxiosInstance } from 'axios';

interface TokenValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    roles?: string[];
  };
  error?: string;
}

class AuthorizationService {
  private authBaseUrl: string;
  private httpClient: AxiosInstance;

  constructor(config: AuthConfig) {
    this.authBaseUrl = `http://${config.authorizationHost}:${config.authorizationPort}`;
    this.httpClient = axios.create({
      baseURL: this.authBaseUrl,
      timeout: 5000,
    });
  }

  /**
   * Validate JWT token with authorization service
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      // Option 1: Call validation endpoint (if available)
      const response = await this.httpClient.post('/api/auth/validate', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
          user: response.data.user,
        };
      }

      return { valid: false, error: 'Token validation failed' };
    } catch (error: any) {
      // Option 2: Try to use token directly - if it works, token is valid
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired token' };
      }

      // If authorization service is unavailable, you might want to:
      // - Validate token locally (if you have the secret)
      // - Or reject the request
      console.error('Authorization service error:', error.message);
      return { valid: false, error: 'Authorization service unavailable' };
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '').trim();
  }
}
```

### 3. Express.js Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthorizationService } from './authorization-service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roles?: string[];
  };
  token?: string;
}

export function createAuthMiddleware(authService: AuthorizationService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip authentication for public endpoints
    const publicPaths = ['/health', '/api/login', '/api/authenticate'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = authService.extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
    }

    // Validate token
    const validation = await authService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: validation.error || 'Invalid or expired token',
      });
    }

    // Attach user info to request
    req.user = validation.user;
    req.token = token;

    next();
  };
}
```

### 4. Alternative: Local JWT Validation (If you have secret key)

```typescript
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  roles?: string[];
  exp: number;
  iat: number;
}

class LocalJwtValidator {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Validate JWT token locally (without calling authorization service)
   * Note: You need the JWT secret key from the system
   */
  validateToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
    try {
      const payload = jwt.verify(token, this.secretKey) as JwtPayload;

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token validation failed' };
    }
  }
}
```

### 5. Complete Express Application Example

```typescript
import express, { Express, Request, Response } from 'express';
import { AuthorizationService } from './authorization-service';
import { createAuthMiddleware } from './auth-middleware';
import { getAuthConfig } from './config';

const app: Express = express();
const config = getAuthConfig();

// Initialize authorization service
const authService = new AuthorizationService(config);

// Middleware
app.use(express.json());
app.use(createAuthMiddleware(authService)); // Apply auth to all routes

// Public health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'your-container' });
});

// Protected endpoint example
app.get('/api/data', async (req: AuthenticatedRequest, res: Response) => {
  // User is authenticated (middleware ensures this)
  // req.user contains user information
  // req.token contains the JWT token

  try {
    // Use the token to call other services
    const response = await axios.get(
      `http://${config.basicDataHost}:${config.basicDataHttpPort}/api/robots`,
      {
        headers: {
          'Authorization': `Bearer ${req.token}`,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data from backend service',
    });
  }
});

// Login endpoint (if your container needs its own login)
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Forward to main authentication service
    const response = await axios.post(
      `http://${config.authorizationHost}:${config.authorizationPort}/api/user/authenticate`,
      { username, password }
    );

    if (response.data.success) {
      res.json({
        success: true,
        token: response.data.data.token,
        user: response.data.data.user,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Authorization service: ${config.authorizationHost}:${config.authorizationPort}`);
});
```

### 6. Axios Interceptor Pattern (Alternative Approach)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class AuthenticatedHttpClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });

    // Intercept requests to add token
    this.client.interceptors.request.use((config: AxiosRequestConfig) => {
      if (this.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Intercept responses to handle 401 (token expired)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.token = null;
          // Optionally: trigger re-authentication
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }
}

// Usage
const httpClient = new AuthenticatedHttpClient('http://krcs-basic-data:7888');
httpClient.setToken('your-jwt-token');
const response = await httpClient.get('/api/robots');
```

---

## What to Add to Your Container

### 1. Dependencies (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "jsonwebtoken": "^9.0.2",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.0"
  }
}
```

### 2. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 3. Dockerfile Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

---

## Request Flow

```
1. User makes request to your container
   GET http://your-container:PORT/api/data
   Headers: Authorization: Bearer <jwt_token>

2. Your container middleware extracts token
   → Extracts "Bearer <jwt_token>"

3. Validates token
   → Calls: http://krcs-basic-data:7888/api/auth/validate
   → Or validates locally

4. If valid:
   → Attaches user info to request
   → Proceeds with request handling
   → Can use token to call other services

5. If invalid:
   → Returns 401 Unauthorized
   → User must re-authenticate
```

---

## Testing

### Test with valid token:
```bash
curl -X GET http://your-container:PORT/api/data \
  -H "Authorization: Bearer <valid_jwt_token>"
```

### Test without token:
```bash
curl -X GET http://your-container:PORT/api/data
# Should return 401 Unauthorized
```

### Test with invalid token:
```bash
curl -X GET http://your-container:PORT/api/data \
  -H "Authorization: Bearer invalid_token"
# Should return 401 Unauthorized
```

---

## Important Notes

1. **Token Storage**: Tokens are stored client-side (browser localStorage/sessionStorage), not in server sessions

2. **Token Expiration**: Tokens expire after a certain time. Handle 401 responses by prompting user to re-login

3. **Public Endpoints**: Define which endpoints don't require authentication (health checks, login, etc.)

4. **Error Handling**: Handle cases where authorization service is unavailable

5. **Token Forwarding**: When calling other services, forward the same token the user provided

6. **Security**: Always validate tokens. Never trust client input without validation.

---

## Integration Checklist

- [ ] Add `AUTHORIZATION_HOST` and `AUTHORIZATION_PORT` to docker-compose environment
- [ ] Install required npm packages (express, axios, jsonwebtoken)
- [ ] Create authorization service class
- [ ] Create authentication middleware
- [ ] Apply middleware to protected routes
- [ ] Test with valid JWT token
- [ ] Test with invalid/missing token
- [ ] Handle token expiration (401 responses)
- [ ] Forward tokens to downstream services

---

## Example: Calling Other Services with Token

```typescript
// In your endpoint handler
app.get('/api/robots', async (req: AuthenticatedRequest, res: Response) => {
  const config = getAuthConfig();
  
  try {
    // Forward user's token to basic-data service
    const response = await axios.get(
      `http://${config.basicDataHost}:${config.basicDataHttpPort}/api/robots`,
      {
        headers: {
          'Authorization': `Bearer ${req.token}`, // Use the token from request
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Token invalid for downstream service' });
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});
```

---

## Troubleshooting

**Problem**: 401 Unauthorized even with valid token
- **Solution**: Check that token is being extracted correctly from `Authorization` header
- **Solution**: Verify authorization service is accessible at `AUTHORIZATION_HOST:PORT`

**Problem**: Authorization service unavailable
- **Solution**: Implement fallback validation (local JWT validation if you have secret)
- **Solution**: Return 503 Service Unavailable instead of 401

**Problem**: Token works for some endpoints but not others
- **Solution**: Check if endpoint requires specific roles/permissions
- **Solution**: Verify token contains required claims

---

## Summary

Your container needs to:
1. ✅ Extract JWT token from `Authorization: Bearer <token>` header
2. ✅ Validate token with `http://krcs-basic-data:7888` (or locally)
3. ✅ Attach user info to request if valid
4. ✅ Return 401 if token is missing/invalid
5. ✅ Forward token when calling other services

This makes your container work seamlessly with the existing authentication system!

