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

// Nigerian Geopolitical Zones (6 zones)
export const NIGERIAN_REGIONS: Record<string, readonly string[]> = {
  'North-West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
  'North-East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North-Central': ['Benue', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'FCT'],
  'South-West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
  'South-East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'South-South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
} as const;

export const NIGERIAN_REGION_NAMES = Object.keys(NIGERIAN_REGIONS) as readonly string[];

// Reverse lookup: state -> region
export const STATE_TO_REGION: Record<string, string> = Object.entries(NIGERIAN_REGIONS)
  .flatMap(([region, states]) => states.map((state) => [state, region] as const))
  .reduce((acc, [state, region]) => ({ ...acc, [state]: region }), {} as Record<string, string>);

// Helper: Get unique regions from selected states
export function getRegionsFromStates(states: string[]): string[] {
  const regions = new Set(states.map((state) => STATE_TO_REGION[state]).filter(Boolean));
  return Array.from(regions);
}

export const ACTIVITY_STATUS_OPTIONS = [
  'Planned',
  'InProgress',
  'OnHold',
  'Completed',
  'Cancelled',
] as const;

export const OBJECTIVE_STATUS_OPTIONS = [
  'Active',
  'Completed',
  'On Hold',
  'Cancelled',
] as const;

export const RISK_RATING_OPTIONS = [
  'Low',
  'Medium',
  'High',
] as const;

export const PRIORITY_OPTIONS = [
  'Low',
  'Medium',
  'High',
  'Critical',
] as const;

export const ACTUAL_CATEGORIES = [
  'Personnel',
  'Equipment',
  'Materials',
  'Consultancy',
  'Travel',
  'Training',
  'Infrastructure',
  'Other',
] as const;
