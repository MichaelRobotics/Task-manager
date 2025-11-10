import axios, { AxiosInstance } from 'axios';
import { getAuthConfig, type AuthConfig } from './config';

export interface TokenValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    roles?: string[];
  };
  error?: string;
}

export class AuthorizationService {
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


