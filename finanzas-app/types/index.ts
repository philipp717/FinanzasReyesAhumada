export type TransactionType = 'ingreso' | 'gasto' | 'ahorro' | 'deuda'

export type Category =
  | 'supermercado'
  | 'mercaderia'
  | 'ropa'
  | 'salud'
  | 'educacion'
  | 'transporte'
  | 'servicios'
  | 'arriendo'
  | 'transferencia'
  | 'deuda'
  | 'mascotas'
  | 'entretenimiento'
  | 'sueldo'
  | 'otro'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category: Category | string
  description: string
  payment_method: string
  date: string
  created_at: string
  receipt_url?: string | null
}

export interface SavingGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  created_at: string
}

export interface OnboardingData {
  monthly_income: number
  income_type: 'fijo' | 'variable'
  main_expenses: string[]
  wants_to_save: boolean
  saving_goal?: string
  saving_goal_amount?: number
  saving_timeframe_months?: number
  has_debts: boolean
  monthly_saving_capacity?: number
  wants_recommendations: boolean
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  onboarding_completed: boolean
  onboarding_data?: OnboardingData
  created_at: string
  phone_number?: string | null
  whatsapp_link_token?: string | null
  whatsapp_linked_at?: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  totalSavings: number
  savingsGoalProgress: number
}
