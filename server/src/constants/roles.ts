export enum Role {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  SANCTION = 'SANCTION',
  DISBURSEMENT = 'DISBURSEMENT',
  COLLECTION = 'COLLECTION',
  BORROWER = 'BORROWER',
}

// Roles that can access the operations dashboard
export const DASHBOARD_ROLES: Role[] = [
  Role.ADMIN,
  Role.SALES,
  Role.SANCTION,
  Role.DISBURSEMENT,
  Role.COLLECTION,
];
