// Authorization configuration
export interface AuthConfig {
  authorizationHost: string;
  authorizationPort: string;
  basicDataHost: string;
  basicDataHttpPort: string;
}

export function getAuthConfig(): AuthConfig {
  return {
    authorizationHost: process.env.AUTHORIZATION_HOST || 'krcs-basic-data',
    authorizationPort: process.env.AUTHORIZATION_PORT || '7888',
    basicDataHost: process.env.BASIC_DATA_HOST || 'krcs-basic-data',
    basicDataHttpPort: process.env.BASIC_DATA_HTTP_PORT || '7888',
  };
}


