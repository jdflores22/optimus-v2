/** Paths CyStaff may use before a container yard is assigned via TEU contract allocation. */
export const CY_STAFF_OPEN_WITHOUT_ASSIGNMENT = ['/profile', '/notifications'] as const;

export function isCyStaffOpenWithoutAssignment(pathname: string): boolean {
  return CY_STAFF_OPEN_WITHOUT_ASSIGNMENT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const CY_STAFF_ASSIGNMENT_PATHS = [
  /^\/$/,
  /^\/pre-forecast(\/|$)/,
  /^\/container-inventory$/,
  /^\/container\/[^/]+\/details$/,
];

export function cyStaffRouteRequiresAssignment(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return CY_STAFF_ASSIGNMENT_PATHS.some((pattern) => pattern.test(path));
}
