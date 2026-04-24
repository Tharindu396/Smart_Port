import { Role } from '../enums/role.enum';

export type Permission = 
  | 'request_berth'
  | 'approve_berth_request'
  | 'override_berth_allocation'
  | 'view_berth_graph'
  | 'upload_manifest'
  | 'view_manifest'
  | 'approve_manifest'
  | 'pay_invoices'
  | 'view_invoices'
  | 'set_tariff_rates'
  | 'verify_manual_payments'
  | 'approve_penalty_waivers'
  | 'track_own_vessels'
  | 'track_all_vessels'
  | 'view_vessel_info'
  | 'manage_yard_density'
  | 'confirm_loading'
  | 'confirm_unloading'
  | 'update_yard_status'
  | 'view_yard_status';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SHIPPING_AGENT]: [
    'request_berth',
    'upload_manifest',
    'view_manifest',
    'pay_invoices',
    'view_invoices',
    'track_own_vessels',
    'view_vessel_info',
  ],
  [Role.BERTH_PLANNER]: [
    'view_berth_graph',
    'approve_berth_request',
    'override_berth_allocation',
    'manage_yard_density',
    'view_yard_status',
    'view_manifest',
    'approve_manifest',
    'track_all_vessels',
    'view_vessel_info',
  ],
  [Role.FINANCE_OFFICER]: [
    'view_invoices',
    'set_tariff_rates',
    'verify_manual_payments',
    'approve_penalty_waivers',
    'view_vessel_info',
    'view_manifest',
  ],
  [Role.OPERATIONS_STAFF]: [
    'confirm_loading',
    'confirm_unloading',
    'update_yard_status',
    'view_yard_status',
    'view_manifest',
    'track_all_vessels',
    'view_vessel_info',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}
