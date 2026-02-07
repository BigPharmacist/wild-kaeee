import { useTheme, useAuth, usePharmacy, useStaff, useNavigation } from '../../context'
import BotendienstView from './BotendienstView'

export default function BotendienstPage() {
  const { theme } = useTheme()
  const { session } = useAuth()
  const { pharmacies } = usePharmacy()
  const { currentStaff, staff } = useStaff()
  const { botendienstTab, setBotendienstTab } = useNavigation()

  return (
    <BotendienstView
      theme={theme}
      session={session}
      currentStaff={currentStaff}
      pharmacies={pharmacies}
      staff={staff}
      botendienstTab={botendienstTab}
      setBotendienstTab={setBotendienstTab}
    />
  )
}
