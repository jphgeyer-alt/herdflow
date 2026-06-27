export interface CattleRecord {
  id: number;
  tag: string;
  breed: string;
  colorId: string;
  gender: 'Female' | 'Male' | 'Other';
  birthDate: string;
  status: 'Active' | 'Sold' | 'Quarantined' | 'Veterinary';
  weight: number;
  campId: number | null;
  note: string;
  createdAt: string;
}

export interface Camp {
  id: number;
  name: string;
  colorId: string;
  description: string;
  createdAt: string;
}

export interface VaccineRecord {
  id: number;
  cattleId: number;
  vaccineName: string;
  scheduledDate: string;
  givenDate: string | null;
  note: string;
  createdAt: string;
}

export interface CountLog {
  id: number;
  campId: number;
  countDate: string;
  bulls: number;
  cows: number;
  calves: number;
  note: string;
  createdAt: string;
}
