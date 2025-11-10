// Admin session management using sessionStorage
const SESSION_KEY = 'admin_logged_in';

export function setAdminLoggedIn(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}



