// Re-export all database types
export * from './database';

// Additional utility types

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Form state helpers
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FormState<T> {
  status: FormStatus;
  data: T | null;
  error: string | null;
}

// Navigation helpers
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
