export interface Building {
  id: string;
  name: string;
  address: string;
  description?: string;
  totalFloors: number;
  createdAt?: any;
}

export interface Office {
  id: string;
  buildingId: string;
  floor: number;
  roomNumber: string;
  area: number;
  pricePerMonth: number;
  status: 'available' | 'rented' | 'maintenance';
  description?: string;
  isDeleted?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  taxId?: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  officeId: string;
  buildingId?: string; // Denormalized for easier search
  startDate: string;
  endDate: string;
  price: number;
  deposit: number;
  status: 'active' | 'expired' | 'terminated';
}

export interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  type: 'rent' | 'electricity' | 'water' | 'service';
}
