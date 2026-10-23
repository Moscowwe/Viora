export type AppMode = string; // Now it can be any tenant_id

export interface Tenant {
  id: string;
  name: string;
  admin_email: string;
  admin_password?: string;
  subscription_end_date: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface KPI {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalStudents: number;
  totalRequired: number;
  totalRemaining: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: string;
}

export interface Child {
  id: string;
  name: string;
  age?: string;
  group_name?: string;
  parent_name?: string;
  phone?: string;
  payment_status?: string;
  fee_amount?: number;
  paid_amount?: number;
  discount_amount?: number;
  discount_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone?: string;
  salary?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category?: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  created_by?: string;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUserMeta: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}
