export interface Rider {
  no: number;
  name: string;
  phone: string;
  available: boolean;
}

export interface RiderPostRequest {
  name: string;
  phone: string;
  available: boolean;
}