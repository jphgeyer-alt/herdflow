export interface CattleRecord {
  id: number;
  tag: string;
  breed: string;
  colorId: string;
  gender: 'Female' | 'Male' | 'Other';
  birthDate: string;
  status: 'Active' | 'Sold' | 'Quarantined' | 'Dead' | 'Veterinary';
  weight: number;
  campId: number | null;
  soldPrice?: number | null;
  soldDate?: string | null;
  soldBuyerAuction?: string;
  deadReason?: string;
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
  campId?: number | null;
  cattleId: number | null;
  vaccineName: string;
  medicineName?: string;
  treatmentType?: 'Vaccine' | 'Medicine' | 'Sick Treatment';
  applicationMethod?: string;
  scheduledDate: string;
  nextDueAt?: string;
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
  personCounted?: string;
  note: string;
  createdAt: string;
}

export interface MarketplaceItem {
  id: number;
  name: string;
  price: string;
  unit: string;
  description: string;
  imageUrl?: string;
  stock: number;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export interface MarketplaceRegistration {
  id: number;
  certificationType: 'Logistics Certified Client' | 'Certified Livestock Seller';
  status: 'Pending' | 'Approved' | 'Rejected';
  name: string;
  companyName: string;
  phone: string;
  email: string;
  region: string;
  note: string;
  createdAt: string;
}

export interface CustomerSignup {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  createdAt: string;
}

export interface MarketplaceOrderLine {
  itemId: number;
  name: string;
  price: string;
  unit: string;
  quantity: number;
  imageUrl?: string;
}

export interface MarketplaceOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Fulfilled' | 'Cancelled';
  paymentMethod: 'PayOnDelivery' | 'Stripe' | 'PayFast';
  paymentStatus: 'Pending' | 'Initiated' | 'Paid' | 'Failed';
  paymentReference: string;
  lines: MarketplaceOrderLine[];
  totalAmount: string;
  createdAt: string;
}

export type CommerceEventName =
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_click'
  | 'place_order_attempt'
  | 'place_order_success';

export interface CommerceAnalyticsEvent {
  id: number;
  event: CommerceEventName;
  at: string;
  path: string;
  session: string;
  experiment: string;
  variant: string;
  itemId?: number;
  itemName?: string;
  category?: string;
  unitPrice?: number;
  currency?: string;
  listPosition?: number;
  source?: string;
  cartItems?: number;
  cartValue?: number;
  lineCount?: number;
  orderNumber?: string;
  totalAmount?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}
