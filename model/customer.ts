export interface Customer {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CustomerPostRequest {
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}
