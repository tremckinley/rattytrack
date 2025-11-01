// Simple admin authentication using environment variable
// For MVP - replace with proper auth system later

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) {
    // If no admin emails configured, allow all (dev mode)
    console.warn('ADMIN_EMAILS not configured - allowing all re-transcriptions');
    return true;
  }
  
  const admins = adminEmails.split(',').map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export function getAdminEmailFromRequest(request: Request): string | null {
  // For now, we'll use a simple header-based approach
  // In production, this should use proper authentication
  const adminEmail = request.headers.get('x-admin-email');
  return adminEmail;
}
