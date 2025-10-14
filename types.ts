export interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  commissionPercentage?: number;
  retouchPeriod?: number; // in months
  dosePrice?: number;
  duration?: number; // in minutes
  ownerId?: string;
  isPublic?: boolean;
}

export interface ServicePackageTemplate {
  id: string;
  name: string;
  serviceId: string;
  price: number;
  sessionCount: number;
  validityDays: number;
  ownerId?: string;
}

export interface ClientPackage {
  id: string;
  clientId: string;
  packageTemplateId: string;
  purchaseDate: string; // ISO Date
  expiryDate: string; // ISO Date
  creditsRemaining: number;
}

export interface Professional {
  id: string;
  name: string;
  serviceIds: string[];
  packageTemplateIds?: string[];
  clientBookablePackageIds?: string[];
  avatarUrl: string;
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  workingDays?: number[]; // 0-6 for Sun-Sat
  loginId: string;
  password: string;
  permissions: string[];
  toolbarItems?: string[];
  employmentType: 'commissioned' | 'salaried' | 'rented';
  fixedSalary?: number;
  rentValue?: number;
  isSalaryActive?: boolean;
  salarySource?: 'salon' | string;
  cpf?: string;
  phone?: string;
  email?: string;
  notes?: string;
  commissionOverrides?: { itemId: string; itemType: 'service' | 'package'; percentage: number }[];
  clientBookablePersonalServiceIds?: string[];
}

export interface StockItem {
  id: string;
  category: string;
  name: string;
  brand?: string;
  detail: string;
  quantity: number;
  lowStockThreshold: number;
  price?: number; // Resale price
  cost?: number; // Purchase cost
  commissionPercentage?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  notes?: string;
  birthdate?: string; // YYYY-MM-DD
  isEmployee?: boolean;
  employeeId?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  service: Service;
  professional: Professional;
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'canceled_late';
  commissionPercentage?: number;
  paymentStatus: 'pending' | 'paid' | 'not_applicable' | 'paid_with_package' | 'pending_package_purchase';
  transactionId?: string;
  clientPackageId?: string;
  pendingPackagePurchaseId?: string;
  ownerId?: string;
}

export interface SaleProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    commissionPercentage?: number;
}

export interface WeeklyDiscount {
  id: string;
  name: string;
  itemId: string; // serviceId or packageTemplateId
  itemType: 'service' | 'package';
  days: number[]; // 0 for Sunday, 6 for Saturday
  discountValue: number;
  discountType: 'PERCENT' | 'FIXED';
}

export interface CartItem {
    id: string;
    type: 'service' | 'product' | 'package';
    item: Service | SaleProduct | ServicePackageTemplate;
    professionalId: string | null;
    commission: number;
    discountValue: number;
    discountType: 'FIXED' | 'PERCENT';
    isDose?: boolean;
    overridePrice?: number;
    isPackage?: boolean;
    clientPackageId?: string;
    triggeredByAppointmentId?: string;
    isRented?: boolean;
    appliedDiscountName?: string;
}

export interface ProcessedCartItem extends CartItem {
    finalPrice: number;
    finalCommissionValue: number;
    isDoseApplied: boolean;
    manualDiscount: number;
}

export interface SaleRecord {
    id: string;
    date: string; // ISO string
    clientIds: string[];
    clientNames: string[];
    items: ProcessedCartItem[];
    totals: {
        subtotal: number;
        discount: number;
        tip: number;
        total: number;
    };
    payment: {
        method: string;
        installments?: number;
    };
}

export interface SalonExpense {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
}

export interface SalonDocument {
  id: string;
  title: string;
  fileDataUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string; // ISO Date string
}