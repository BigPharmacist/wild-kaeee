import { useTheme, useAuth, usePharmacy } from '../../context'
import ScanView from './ScanView'

export default function ScanPage() {
  const { theme } = useTheme()
  const { session } = useAuth()
  const { pharmacies } = usePharmacy()

  return (
    <ScanView
      theme={theme}
      session={session}
      pharmacyId={pharmacies?.[0]?.id || null}
    />
  )
}
