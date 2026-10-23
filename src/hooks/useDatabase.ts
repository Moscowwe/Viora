import { useAppMode } from "./useAppMode";

export const useDatabase = () => {
  const { mode } = useAppMode();

  const getStorageKey = (table: string) => `viora_${mode}_${table}`;
  const getTableData = (table: string): any[] => {
    const data = localStorage.getItem(getStorageKey(table));
    if (!data && table === 'users') {
      const defaultUsers = [{
        id: crypto.randomUUID(),
        email: 'mina@prodigy.ro',
        password: 'R0nald0r',
        display_name: 'Mina',
        role: 'admin',
        created_at: new Date().toISOString()
      }];
      localStorage.setItem(getStorageKey(table), JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return data ? JSON.parse(data) : [];
  };
  
  const saveTableData = (table: string, data: any[]) => {
    localStorage.setItem(getStorageKey(table), JSON.stringify(data));
  };

  const from = <T = any>(table: string) => {
    const queryParameters: { 
      table: string; 
      action?: string; 
      data?: any; 
      where_clauses?: { col: string, op: string, val: unknown }[]; 
      id?: string;
      order?: { col: string, asc: boolean };
      columns?: string;
    } = { table };

    const builder = {
      select: (columns: string = "*") => {
        queryParameters.action = 'select';
        queryParameters.columns = columns;
        return builder as any;
      },
      eq: (column: string, value: unknown) => {
        queryParameters.where_clauses = [...(queryParameters.where_clauses || []), { col: column, op: 'eq', val: value }];
        if (column === 'id' && typeof value === 'string') queryParameters.id = value;
        return builder as any;
      },
      neq: (column: string, value: unknown) => {
        queryParameters.where_clauses = [...(queryParameters.where_clauses || []), { col: column, op: 'neq', val: value }];
        return builder as any;
      },
      order: (column: string, { ascending = true } = {}) => {
        queryParameters.order = { col: column, asc: ascending };
        return builder as any;
      },
      insert: (data: any) => {
        queryParameters.action = 'insert';
        queryParameters.data = data;
        return builder as any;
      },
      update: (data: Partial<T>) => {
        queryParameters.action = 'update';
        queryParameters.data = data;
        return builder as any;
      },
      delete: () => {
        queryParameters.action = 'delete';
        return builder as any;
      },
      then: async (onSuccess: (res: { data: any, error: any }) => void, onError?: (err: Error) => void) => {
        try {
          const { table, action, data, where_clauses, order, id } = queryParameters;
          let tableData = getTableData(table);
          let result: any = null;

          if (action === 'insert') {
            const newItem = { ...data, id: data.id || crypto.randomUUID(), created_at: new Date().toISOString() };
            tableData.push(newItem);
            saveTableData(table, tableData);
            result = newItem;
          } else if (action === 'update') {
            tableData = tableData.map((item: any) => {
              let match = true;
              if (id) {
                 match = item.id === id;
              } else if (where_clauses) {
                match = where_clauses.every(w => {
                  if (w.op === 'eq') return item[w.col] === w.val;
                  if (w.op === 'neq') return item[w.col] !== w.val;
                  return true;
                });
              }
              return match ? { ...item, ...data, updated_at: new Date().toISOString() } : item;
            });
            saveTableData(table, tableData);
            result = { success: true };
          } else if (action === 'delete') {
            tableData = tableData.filter((item: any) => {
              let match = true;
              if (id) {
                 match = item.id === id;
              } else if (where_clauses) {
                match = where_clauses.every(w => {
                  if (w.op === 'eq') return item[w.col] === w.val;
                  if (w.op === 'neq') return item[w.col] !== w.val;
                  return true;
                });
              }
              return !match;
            });
            saveTableData(table, tableData);
            result = { success: true };
          } else {
            result = tableData;
            if (where_clauses) {
              result = result.filter((item: any) => {
                return where_clauses.every(w => {
                  if (w.op === 'eq') return item[w.col] === w.val;
                  if (w.op === 'neq') return item[w.col] !== w.val;
                  return true;
                });
              });
            }
            if (order) {
              result.sort((a: any, b: any) => {
                if (a[order.col] < b[order.col]) return order.asc ? -1 : 1;
                if (a[order.col] > b[order.col]) return order.asc ? 1 : -1;
                return 0;
              });
            }
          }

          const response = { data: result, error: null };
          if (onSuccess) return onSuccess(response);
          return response;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (onError) return onError(err);
          const response = { data: null, error: err };
          if (onSuccess) return onSuccess(response);
          return response;
        }
      }
    };

    return builder;
  };

  return { from };
};
