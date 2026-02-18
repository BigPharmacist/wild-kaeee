import { lazyWithRetry } from '../../lib/lazyWithRetry'

const DashboardHome = lazyWithRetry(() => import('./DashboardHome'))

export default function DashboardHomePage() {
  return (
    <div className="max-w-5xl">
      <DashboardHome />
    </div>
  )
}
