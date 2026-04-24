export enum Role {
  SHIPPING_AGENT = 'shipping_agent',
  BERTH_PLANNER = 'berth_planner',
  FINANCE_OFFICER = 'finance_officer',
  OPERATIONS_STAFF = 'operations_staff',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SHIPPING_AGENT]: 'External client - Request berths, upload manifests, pay invoices, track their own vessels',
  [Role.BERTH_PLANNER]: 'Internal operations - Overlook Neo4j graph, approve allocations, manage yard density',
  [Role.FINANCE_OFFICER]: 'Financial control - Set tariff rates, verify payments, approve penalty waivers',
  [Role.OPERATIONS_STAFF]: 'Ground work - Confirm container loading/unloading, update real-time yard status',
};
