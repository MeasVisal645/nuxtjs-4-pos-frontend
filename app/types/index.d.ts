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

export interface Product {
  id: number;
  code: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  unit: string;
  active: boolean;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
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

export interface Mail {
  id: number;
  unread?: boolean;
  from: User;
  subject: string;
  body: string;
  date: string;
}

export interface Member {
  name: string;
  username: string;
  role: "member" | "owner";
  avatar: AvatarProps;
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

export interface Notification {
  id: number;
  unread?: boolean;
  sender: User;
  body: string;
  date: string;
}

export type Period = "daily" | "weekly" | "monthly";

export interface Range {
  start: Date;
  end: Date;
}
