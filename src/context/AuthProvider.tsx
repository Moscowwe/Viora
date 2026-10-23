import { createContext, useContext, useEffect, useState } from "react";
import { useAppMode } from "@/hooks/useAppMode";
import { User, AuthContextType } from "@/types";

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  signIn: async () => false,
  signOut: async () => {},
  updateUserMeta: async () => {},
  changePassword: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { mode, setMode } = useAppMode();

  useEffect(() => {
    const savedUser = localStorage.getItem("local_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as User);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setLoading(false);
  }, []);

  const getStorageKey = (table: string) => `viora_${mode}_${table}`;
  const getUsers = (): any[] => {
    const data = localStorage.getItem(getStorageKey('users'));
    if (!data) {
      const defaultUsers = [{
        id: crypto.randomUUID(),
        email: 'mina@prodigy.ro', // keeping this as the dummy prodigy nursery
        password: 'R0nald0r',
        display_name: 'Mina',
        role: 'admin',
        created_at: new Date().toISOString()
      }];
      localStorage.setItem(getStorageKey('users'), JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  };
  const saveUsers = (users: any[]) => {
    localStorage.setItem(getStorageKey('users'), JSON.stringify(users));
  };

  const signIn = async (email: string, password: string) => {
    // 1. Super Admin login
    if (email === "super" && password === "superadmin") {
      const superUser: User = { id: "super", email, display_name: "Viora Owner", role: "superadmin" };
      setUser(superUser);
      localStorage.setItem("local_user", JSON.stringify(superUser));
      return true;
    }

    // 2. Tenant Admin login
    const saasTenantsStr = localStorage.getItem("viora_saas_tenants");
    const tenants = saasTenantsStr ? JSON.parse(saasTenantsStr) : [];
    
    const tenant = tenants.find((t: any) => t.admin_email === email && t.admin_password === password);
    if (tenant) {
      if (tenant.status !== 'active') throw new Error("Account is suspended. Please contact support.");
      if (new Date(tenant.subscription_end_date) < new Date()) throw new Error("Subscription expired. Please renew.");

      const tenantUser: User = { id: tenant.id, email: tenant.admin_email, display_name: tenant.name, role: "admin" };
      setUser(tenantUser);
      localStorage.setItem("local_user", JSON.stringify(tenantUser));
      setMode(tenant.id, false); // Set active tenant database without reload
      return true;
    }

    // 3. Regular Staff login within the currently active tenant
    const users = getUsers();
    const loggedInUser = users.find(u => u.email === email && u.password === password);
    
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem("local_user", JSON.stringify(loggedInUser));
      return true;
    }

    throw new Error("Invalid email or password");
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("local_user");
  };

  const updateUserMeta = async (updates: { display_name?: string; avatar_url?: string }) => {
    if (!user) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      saveUsers(users);
    }

    const updatedUser = { ...user, ...updates } as User;
    setUser(updatedUser);
    localStorage.setItem("local_user", JSON.stringify(updatedUser));
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], password: newPassword };
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUserMeta, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
