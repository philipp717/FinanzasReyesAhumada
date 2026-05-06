import { redirect } from 'next/navigation'

// Ingresos se maneja desde la página de gastos con filtro de tipo
export default function IngresosPage() {
  redirect('/gastos')
}
