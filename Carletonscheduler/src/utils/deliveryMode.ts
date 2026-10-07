import { isOnlineMode, normalizeDeliveryMode, type DeliveryMode, type DeliveryPreference } from '@shared/delivery-mode';

export { isOnlineMode, normalizeDeliveryMode, type DeliveryMode, type DeliveryPreference };

export const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  IN_PERSON: 'In person',
  ONLINE_SYNC: 'Online · live',
  ONLINE_ASYNC: 'Online · on your own time',
  HYBRID: 'Hybrid',
};

export const DELIVERY_PREFERENCE_LABELS: Record<DeliveryPreference, string> = {
  any: 'Any',
  'in-person': 'In person',
  online: 'Online',
};
