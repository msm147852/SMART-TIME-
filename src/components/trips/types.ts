export interface TripLocation {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  name?: string;
}

export type LocationPickerMode = 'pickup' | 'dropoff';
