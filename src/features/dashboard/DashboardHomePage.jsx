import { lazy } from 'react'

const DashboardHome = lazy(() => import('./DashboardHome'))

export default function DashboardHomePage() {
  return (
    <div className="max-w-5xl">
      <DashboardHome />
    </div>
  )
}
