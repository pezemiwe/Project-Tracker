/**
 * Nigerian States and FCT
 */
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'FCT',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/**
 * Nigerian Geopolitical Zones (6 zones)
 */
export const NIGERIAN_REGIONS: Record<string, readonly string[]> = {
  'North-West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
  'North-East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North-Central': ['Benue', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'FCT'],
  'South-West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
  'South-East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'South-South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
} as const;

// Reverse lookup: state -> region
export const STATE_TO_REGION: Record<string, string> = Object.entries(NIGERIAN_REGIONS)
  .flatMap(([region, states]) => states.map((state) => [state, region] as const))
  .reduce((acc, [state, region]) => ({ ...acc, [state]: region }), {} as Record<string, string>);

/**
 * Activity statuses
 */
export const ACTIVITY_STATUSES = ['Planned', 'InProgress', 'OnHold', 'Completed', 'Cancelled'] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

/**
 * Priority levels
 */
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/**
 * Risk ratings
 */
export const RISK_RATINGS = ['Low', 'Medium', 'High'] as const;

export type RiskRating = (typeof RISK_RATINGS)[number];
