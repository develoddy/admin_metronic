/**
 * INTERFACES DEL MÓDULO FINANCIERO
 * 
 * Estas interfaces TypeScript definen la estructura de datos
 * para el módulo de gestión financiera personal.
 */

// ============================================
// BANK ACCOUNT - Cuenta Bancaria
// ============================================
export interface BankAccount {
  id?: number;
  user_id?: number;
  name: string;
  bank_name?: string;
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// INCOME - Ingreso
// ============================================
export interface Income {
  id?: number;
  user_id?: number;
  bank_account_id?: number;
  category: 'salary' | 'freelance' | 'investments' | 'rental' | 'business' | 'gifts' | 'internal_transfer' | 'other';
  amount: number;
  currency: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'none';
  tags?: string;
  notes?: string;
  source_account_id?: number; // Para transferencias internas: cuenta origen
  linked_transaction_id?: number; // ID del expense/income relacionado
  bankAccount?: BankAccount; // Para eager loading
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// EXPENSE - Gasto
// ============================================
export interface Expense {
  id?: number;
  user_id?: number;
  bank_account_id?: number;
  category: 'housing' | 'utilities' | 'groceries' | 'transport' | 'health' | 
            'insurance' | 'entertainment' | 'education' | 'clothing' | 
            'savings' | 'investments' | 'debt_payment' | 'restaurants' | 
            'travel' | 'gifts' | 'personal_care' | 'technology' | 'internal_transfer' | 'other';
  amount: number;
  currency: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'none';
  is_essential: boolean;
  payment_method: 'cash' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'other';
  tags?: string;
  receipt_url?: string;
  notes?: string;
  target_account_id?: number; // Para transferencias internas: cuenta destino
  linked_transaction_id?: number; // ID del expense/income relacionado
  bankAccount?: BankAccount; // Para eager loading
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// DEBT - Deuda
// ============================================
export interface Debt {
  id?: number;
  user_id?: number;
  bank_account_id?: number;
  creditor: string;
  debt_type: 'mortgage' | 'car_loan' | 'personal_loan' | 'student_loan' | 'credit_card' | 'business_loan' | 'other';
  original_amount: number;
  remaining_balance: number;
  currency: string;
  interest_rate?: number;
  monthly_payment?: number;
  start_date: string; // Format: YYYY-MM-DD
  due_date?: string; // Format: YYYY-MM-DD
  payment_day?: number;
  status: 'active' | 'paid_off' | 'defaulted' | 'refinanced';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  bankAccount?: BankAccount; // Para eager loading
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// FINANCIAL METRICS - Métricas Financieras
// ============================================
export interface MonthlyBalance {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeByCategory: { [key: string]: number };
  expensesByCategory: { [key: string]: number };
  essentialExpenses: number;
  nonEssentialExpenses: number;
  transactionCount: {
    incomes: number;
    expenses: number;
  };
}

export interface DebtRatio {
  totalDebt: number;
  totalMonthlyPayment: number;
  monthlyIncome: number; // Ingreso del mes actual
  debtToIncomeRatio: number; // DTI en % (ej: 5.77%, 35%)
  debtBurden: number; // Meses para pagar la deuda (ej: 8.33 meses)
  debtByType: { [key: string]: number };
  activeDebtsCount: number;
}

export interface SavingsRate {
  month: string;
  savingsRate: number;
  totalSavings: number;
  totalIncome: number;
  totalExpenses: number;
  message?: string;
}

export interface FinancialHealth {
  status: 'VERDE' | 'AMARILLO' | 'ROJO';
  statusColor: 'success' | 'warning' | 'danger';
  statusDescription: string;
  healthScore: number;
  metrics: {
    savingsRate: number;
    debtToIncomeRatio: number; // DTI en % (ej: 10%, 35%)
    debtBurden: number; // Meses de ingreso (ej: 2.43)
    monthlyBalance: number;
  };
  issues: string[];
  recommendations: string[];
  evaluatedMonth: string;
  evaluatedAt: string;
}

export interface BankAccountMetrics {
  accountId: number;
  accountName: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  currency: string;
  currentBalance: number;
  monthlyMetrics: {
    totalIncome: number;
    totalExpenses: number;
    monthlyBalance: number;
    essentialExpenses: number;
    nonEssentialExpenses: number;
    incomeCount: number;
    expenseCount: number;
    transferredOut?: number; // Transferencias salientes (expense internal_transfer)
    transferredIn?: number; // Transferencias entrantes (income internal_transfer)
    transfersCount?: number; // Total de transferencias (in + out)
  };
  incomeByCategory: { [key: string]: number };
  expensesByCategory: { 
    [key: string]: {
      total: number;
      count: number;
      essential: number;
      nonEssential: number;
    }
  };
}

export interface FinancialSummary {
  summary: {
    month: string;
    totalBankBalance: number;
    monthlyBalance: number;
    totalIncome: number;
    totalExpenses: number;
    totalDebt: number;
    savingsRate: number;
  };
  monthlyBalance: MonthlyBalance;
  debtInfo: DebtRatio;
  savingsInfo: SavingsRate;
  healthStatus: FinancialHealth;
  bankAccounts: BankAccount[];
  accountMetrics: BankAccountMetrics[];
}

// ============================================
// INTERNAL TRANSFER - Transferencia Interna
// ============================================
export interface InternalTransferRequest {
  source_account_id: number;
  target_account_id?: number; // Opcional si es transferencia externa
  amount: number;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'none';
  notes?: string;
  is_external?: boolean; // Nueva: indica si es transferencia externa
  external_recipient?: string; // Nueva: nombre del destinatario externo
}

export interface InternalTransferResponse {
  expense: Expense;
  income?: Income; // Opcional, solo para transferencias internas
  sourceAccount: BankAccount;
  targetAccount?: BankAccount; // Opcional, solo para transferencias internas
  type: 'internal' | 'external'; // Nuevo: tipo de transferencia
}

// ============================================
// INTERNAL TRANSFERS SUMMARY - Resumen de Transferencias Internas
// ============================================
export interface TransferRoute {
  sourceAccount: BankAccount;
  targetAccount: BankAccount;
  totalAmount: number;
  count: number;
  transfers: Expense[];
}

export interface InternalTransfersSummary {
  month: string;
  totalTransferred: number;
  transferCount: number;
  transferRoutes: { [route: string]: TransferRoute };
  transfers: Expense[];
}

// ============================================
// FINANCIAL OVERVIEW - Vista Rápida Financiera
// ============================================
export interface FinancialOverview {
  month: string;
  monthlyBalance: number;
  totalIncome: number;
  totalExpenses: number;
  status: 'surplus' | 'deficit' | 'balanced';
  statusColor: 'success' | 'danger' | 'warning';
  accountBreakdown: AccountExpenseBreakdown[];
  categoryBreakdown: CategoryExpenseBreakdown[];
  debtPriority: DebtPriorityItem[];
  recommendations: FinancialRecommendation[];
  detailedInsights?: DetailedInsights; // NUEVO: Análisis más profundo (opcional)
}

export interface AccountExpenseBreakdown {
  accountId: number;
  accountName: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  totalExpenses: number;
  items: {
    concept: string;
    category: string;
    amount: number;
  }[];
}

export interface CategoryExpenseBreakdown {
  category: string;
  categoryLabel: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface DebtPriorityItem {
  debtId: number;
  priority: number; // 1 = más urgente
  creditor: string;
  debtType: string;
  monthlyPayment: number;
  remainingBalance: number;
  interestRate: number;
  reasoning: string; // Por qué está en esta posición
}

export interface FinancialRecommendation {
  type: 'alert' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
  savingsPotential?: number; // NUEVO: Ahorro potencial en euros
  context?: string; // NUEVO: Contexto adicional con números específicos
}

// ============================================
// DETAILED EXPENSE ANALYSIS - Análisis detallado de gastos
// ============================================
export interface ExpenseInsight {
  category: string;
  categoryLabel: string;
  currentAmount: number;
  marketBenchmark?: number; // Gasto promedio del mercado
  savingsPotential?: number; // Cuánto podrías ahorrar
  suggestion: string;
  priority: 'high' | 'medium' | 'low'; // Alta = revisar urgente
}

export interface UserProfile {
  profileType: 'indie_hacker' | 'freelancer' | 'family' | 'standard';
  confidence: number; // 0-100: qué tan seguro está el algoritmo
  indicators: string[]; // Qué gastos lo indican
  professionalTools?: {
    tool: string;
    category: string;
    amount: number;
    verdict: 'essential' | 'review' | 'optional';
    reasoning: string;
  }[];
}

export interface DetailedInsights {
  expenseInsights: ExpenseInsight[];
  userProfile: UserProfile;
  savingsPotentialTotal: number;
  debtContext?: {
    totalDebts: number;
    totalMonthlyPayment: number;
    percentageOfIncome: number;
    message: string;
  };
}

// ============================================
// API RESPONSE - Respuesta del API
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ============================================
// CATEGORÍAS Y OPCIONES
// ============================================
export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salario' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investments', label: 'Inversiones' },
  { value: 'rental', label: 'Alquiler' },
  { value: 'business', label: 'Negocio' },
  { value: 'gifts', label: 'Regalos' },
  { value: 'internal_transfer', label: 'Transferencia Interna' },
  { value: 'other', label: 'Otro' }
];

export const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Vivienda' },
  { value: 'utilities', label: 'Servicios' },
  { value: 'groceries', label: 'Alimentación' },
  { value: 'transport', label: 'Transporte' },
  { value: 'health', label: 'Salud' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'education', label: 'Educación' },
  { value: 'clothing', label: 'Ropa' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'investments', label: 'Inversiones' },
  { value: 'debt_payment', label: 'Pago de Deudas' },
  { value: 'restaurants', label: 'Restaurantes' },
  { value: 'travel', label: 'Viajes' },
  { value: 'gifts', label: 'Regalos' },
  { value: 'personal_care', label: 'Cuidado Personal' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'internal_transfer', label: 'Transferencia Interna' },
  { value: 'other', label: 'Otro' }
];

export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta Corriente' },
  { value: 'savings', label: 'Cuenta de Ahorros' },
  { value: 'credit', label: 'Tarjeta de Crédito' },
  { value: 'investment', label: 'Cuenta de Inversión' },
  { value: 'other', label: 'Otra' }
];

export const DEBT_TYPES = [
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'car_loan', label: 'Préstamo de Auto' },
  { value: 'personal_loan', label: 'Préstamo Personal' },
  { value: 'student_loan', label: 'Préstamo Estudiantil' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
  { value: 'business_loan', label: 'Préstamo de Negocio' },
  { value: 'other', label: 'Otro' }
];

export const RECURRENCE_TYPES = [
  { value: 'none', label: 'No recurrente' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' }
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Tarjeta de Débito' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
  { value: 'bank_transfer', label: 'Transferencia Bancaria' },
  { value: 'other', label: 'Otro' }
];

export const DEBT_STATUS = [
  { value: 'active', label: 'Activa' },
  { value: 'paid_off', label: 'Pagada' },
  { value: 'defaulted', label: 'En Mora' },
  { value: 'refinanced', label: 'Refinanciada' }
];

// ============================================
// BOOTSTRAP ICONS - Iconos para categorías
// ============================================
export const EXPENSE_CATEGORY_ICONS: { [key: string]: string } = {
  housing: 'bi-house-door',
  utilities: 'bi-lightning-charge',
  groceries: 'bi-cart',
  transport: 'bi-bus-front',
  health: 'bi-heart-pulse',
  insurance: 'bi-shield-check',
  entertainment: 'bi-film',
  education: 'bi-book',
  clothing: 'bi-bag',
  savings: 'bi-piggy-bank',
  investments: 'bi-graph-up-arrow',
  debt_payment: 'bi-credit-card-2-back',
  restaurants: 'bi-cup-straw',
  travel: 'bi-airplane',
  gifts: 'bi-gift',
  personal_care: 'bi-scissors',
  technology: 'bi-laptop',
  internal_transfer: 'bi-arrow-left-right',
  other: 'bi-three-dots'
};

export const INCOME_CATEGORY_ICONS: { [key: string]: string } = {
  salary: 'bi-briefcase',
  freelance: 'bi-laptop',
  investments: 'bi-graph-up-arrow',
  rental: 'bi-building',
  business: 'bi-shop',
  gifts: 'bi-gift',
  internal_transfer: 'bi-arrow-left-right',
  other: 'bi-cash-coin'
};

export const ACCOUNT_TYPE_ICONS: { [key: string]: string } = {
  checking: 'bi-wallet2',
  savings: 'bi-piggy-bank',
  credit: 'bi-credit-card',
  investment: 'bi-graph-up',
  other: 'bi-bank'
};

export const DEBT_TYPE_ICONS: { [key: string]: string } = {
  mortgage: 'bi-house-door',
  car_loan: 'bi-car-front',
  personal_loan: 'bi-cash-stack',
  student_loan: 'bi-mortarboard',
  credit_card: 'bi-credit-card',
  business_loan: 'bi-shop',
  other: 'bi-currency-exchange'
};

export const PAYMENT_METHOD_ICONS: { [key: string]: string } = {
  cash: 'bi-cash',
  debit_card: 'bi-credit-card',
  credit_card: 'bi-credit-card-2-front',
  bank_transfer: 'bi-bank',
  other: 'bi-coin'
};

// Helper function para obtener clase de badge según categoría
export function getCategoryBadgeClass(category: string, type: 'expense' | 'income' | 'debt' = 'expense'): string {
  const categoryMap: { [key: string]: string } = {
    // Expenses
    housing: 'primary',
    utilities: 'warning',
    groceries: 'success',
    transport: 'info',
    health: 'danger',
    insurance: 'secondary',
    entertainment: 'purple',
    education: 'info',
    clothing: 'pink',
    savings: 'success',
    investments: 'primary',
    debt_payment: 'danger',
    restaurants: 'warning',
    travel: 'info',
    gifts: 'pink',
    personal_care: 'secondary',
    technology: 'primary',
    internal_transfer: 'info',
    // Incomes
    salary: 'success',
    freelance: 'info',
    rental: 'primary',
    business: 'warning',
    // Debts
    mortgage: 'danger',
    car_loan: 'warning',
    personal_loan: 'info',
    student_loan: 'primary',
    credit_card: 'danger',
    business_loan: 'warning',
    other: 'secondary'
  };
  
  return categoryMap[category] || 'secondary';
}

export const DEBT_PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' }
];

export const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'MXN', label: 'MXN ($)', symbol: '$' },
  { value: 'COP', label: 'COP ($)', symbol: '$' },
  { value: 'ARS', label: 'ARS ($)', symbol: '$' }
];

// ============================================
// ASSET - Activo (Patrimonio)
// ============================================
export interface Asset {
  id?: number;
  user_id?: number;
  name: string;
  type: 'cash' | 'property' | 'investment' | 'vehicle' | 'other';
  current_value: number;
  bank_account_id?: number;
  purchase_date?: string; // Format: YYYY-MM-DD
  notes?: string;
  is_active: boolean;
  last_updated?: Date;
  created_at?: Date;
  bankAccount?: BankAccount; // Para eager loading
}

export const ASSET_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: 'bi-cash-stack' },
  { value: 'property', label: 'Propiedad', icon: 'bi-house-fill' },
  { value: 'investment', label: 'Inversión', icon: 'bi-graph-up-arrow' },
  { value: 'vehicle', label: 'Vehículo', icon: 'bi-car-front-fill' },
  { value: 'other', label: 'Otro', icon: 'bi-box' }
];

// ============================================
// LIABILITY - Pasivo (Patrimonio)
// ============================================
export interface Liability {
  id?: number;
  user_id?: number;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'debt' | 'other';
  total_amount: number;
  remaining_amount: number;
  monthly_payment?: number;
  interest_rate?: number;
  start_date?: string; // Format: YYYY-MM-DD
  due_date?: string; // Format: YYYY-MM-DD
  notes?: string;
  is_active: boolean;
  last_updated?: Date;
  created_at?: Date;
}

export const LIABILITY_TYPES = [
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: 'bi-credit-card' },
  { value: 'loan', label: 'Préstamo', icon: 'bi-bank' },
  { value: 'mortgage', label: 'Hipoteca', icon: 'bi-house-door' },
  { value: 'debt', label: 'Deuda', icon: 'bi-exclamation-triangle' },
  { value: 'other', label: 'Otro', icon: 'bi-question-circle' }
];

// ============================================
// NET WORTH - Patrimonio Neto
// ============================================
export interface NetWorth {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  breakdown: {
    assets: {
      explicit: number;
      bankAccounts: number;
      byType: {
        [key: string]: number;
      };
    };
    liabilities: {
      byType: {
        [key: string]: number;
      };
    };
  };
  counts: {
    assets: number;
    bankAccounts: number;
    liabilities: number;
  };
}

export interface NetWorthSnapshot {
  id?: number;
  user_id?: number;
  snapshot_date: string; // Format: YYYY-MM-DD
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  notes?: string;
  created_at?: Date;
}
