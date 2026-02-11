import type { AvatarProps } from "@nuxt/ui";

export type PolicyStatus = "New Policy" | "Renew Policy" | "Cancelled";
export type SaleStatus = "paid" | "failed" | "refunded";

export interface Policy {
  id?: number;
  policyNo: string;
  policyHolder: string;
  premium: number;
  sumInsured: number;
  inceptionDate: string;
  expiredDate: string;
  issueDate: string;
  address: string;
  province: string;
  product: string;
  items: any[];
}

export interface items {
  id?: number;
  policyNo: string;
  inceptionDate: string;
  expiredDate: string;
  issueDate: string;
  insuredName: string;
  cardNo: string;
  dob: string;
  gender: string;
  remark: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  unit: string;
  active: boolean;
  imageUrl: AvatarProps | null;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  natId: string;
  nssfId: string;
  active: boolean;
  imageUrl: AvatarProps | null;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  imageUrl: AvatarProps | null;
}

export interface EmployeeUser {
  employee: Employee;
  user: User[];
}

export type PageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export interface Category {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export interface AuditLog {
  id: number;
  userId: number;
  method: string;
  path: string;
  param: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface QuantityAdjustment {
  productName: string;
  userId: string;
  method: string;
  quantity: number;
  complete: boolean;
  createdDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  active: boolean;
  createdDate: string;
}

export interface SupplierContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  active: boolean;
}

export interface SupplierWithContacts {
  supplier: Supplier;
  supplierContacts: SupplierContact[];
}

type LowStockProduct = {
  id: number;
  code: string;
  name: string;
  quantity: number;
};

export interface Notification {
  id: number;
  unread?: boolean;
  sender: User;
  body: string;
  date: string;
}

export interface Stat {
  title: string;
  icon: string;
  value: number | string;
  variation: number;
  formatter?: (value: number) => string;
}

export interface Sale {
  id: string;
  date: string;
  status: SaleStatus;
  email: string;
  amount: number;
}

export type Period = "daily" | "weekly" | "monthly";

export interface Range {
  start: Date;
  end: Date;
}
