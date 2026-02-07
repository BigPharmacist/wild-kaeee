import { useTheme, usePharmacy, useNavigation, useEmail } from '../../context'
import DokumenteView from './DokumenteView'

export default function DokumentePage() {
  const { theme } = useTheme()
  const { pharmacies } = usePharmacy()
  const { dokumenteTab } = useNavigation()
  const { aiSettings } = useEmail()

  return (
    <DokumenteView
      theme={theme}
      dokumenteTab={dokumenteTab}
      pharmacies={pharmacies}
      aiSettings={aiSettings}
      currentPharmacyId={pharmacies?.[0]?.id || null}
    />
  )
}
