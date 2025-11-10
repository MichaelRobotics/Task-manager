import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationService } from './authorization-service';
import { getAuthConfig } from './config';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/api/health', '/api/login', '/api/authenticate'];

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    roles?: string[];
  };
  token?: string;
}

/**
 * Authorization middleware for Next.js API routes
 * Validates JWT tokens and attaches user information to the request
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip authentication for public endpoints
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return handler(request as AuthenticatedRequest);
  }

  // Extract token from header
  const authHeader = request.headers.get('authorization');
  const config = getAuthConfig();
  const authService = new AuthorizationService(config);
  const token = authService.extractToken(authHeader || undefined);

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      },
      { status: 401 }
    );
  }

  // Validate token
  const validation = await authService.validateToken(token);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_TOKEN',
        message: validation.error || 'Invalid or expired token',
      },
      { status: 401 }
    );
  }

  // Attach user info to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = validation.user;
  authenticatedRequest.token = token;

  return handler(authenticatedRequest);
}


