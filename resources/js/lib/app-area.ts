/**
 * The app has two areas sharing one layout: the admin area (every page under
 * /admin) and the member area (everything else). The sidebar and header use
 * this to decide which navigation to show.
 */
export const ADMIN_HOME = '/admin';
export const MEMBER_HOME = '/dashboard';

export function isAdminArea(path: string): boolean {
    return path === ADMIN_HOME || path.startsWith(`${ADMIN_HOME}/`);
}
