import { useState, useEffect } from 'react'
import { Users, CalendarBlank, Clock, FileText, GearSix, Info, ChartBar } from '@phosphor-icons/react'
import { useMjProfiles } from './hooks/useMjProfiles'
import { buildStaffColorMap, buildStaffColorIndexMap } from './shared/staffColors'
import { MitarbeiterList } from './mitarbeiter/MitarbeiterList'
import { DienstplanView } from './dienstplan/DienstplanView'
import { ZeiterfassungView } from './zeiterfassung/ZeiterfassungView'
import { MonatsberichteView } from './monatsberichte/MonatsberichteView'
import { EinstellungenView } from './einstellungen/EinstellungenView'
import { InfoView } from './info/InfoView'
import { StatistikenView } from './statistiken/StatistikenView'

const subTabs = [
  { id: 'dienstplan', label: 'Dienstplan', icon: CalendarBlank },
  { id: 'zeiterfassung', label: 'Zeiterfassung', icon: Clock },
  { id: 'berichte', label: 'Berichte', icon: FileText },
  { id: 'mitarbeiter', label: 'Mitarbeiter', icon: Users },
  { id: 'einstellungen', label: 'Einstellungen', icon: GearSix },
  { id: 'statistiken', label: 'Statistik', icon: ChartBar },
  { id: 'info', label: 'Info', icon: Info },
]

export default function MinijobberView({ theme, session, currentStaff, pharmacies, staff }) {
  const [activeSubTab, setActiveSubTab] = useState('dienstplan')
  const pharmacyId = currentStaff?.pharmacy_id || pharmacies?.[0]?.id

  const profilesHook = useMjProfiles({ pharmacyId })

  useEffect(() => {
    if (pharmacyId) {
      profilesHook.fetchProfiles()
    }
  }, [pharmacyId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build color maps synchronously before children render
  if (profilesHook.profiles.length > 0) {
    buildStaffColorMap(profilesHook.profiles)
    buildStaffColorIndexMap(profilesHook.profiles)
  }

  const renderContent = () => {
    switch (activeSubTab) {
      case 'mitarbeiter':
        return (
          <MitarbeiterList
            theme={theme}
            pharmacyId={pharmacyId}
            staff={staff}
            profilesHook={profilesHook}
          />
        )
      case 'dienstplan':
        return (
          <DienstplanView
            theme={theme}
            pharmacyId={pharmacyId}
            profiles={profilesHook.profiles}
            pharmacyName={pharmacies?.find(p => p.id === pharmacyId)?.name}
          />
        )
      case 'zeiterfassung':
        return (
          <ZeiterfassungView
            theme={theme}
            pharmacyId={pharmacyId}
            profiles={profilesHook.profiles}
          />
        )
      case 'berichte':
        return (
          <MonatsberichteView
            theme={theme}
            pharmacyId={pharmacyId}
            pharmacies={pharmacies}
            profiles={profilesHook.profiles}
            swapSortOrder={profilesHook.swapSortOrder}
            currentStaff={currentStaff}
          />
        )
      case 'einstellungen':
        return (
          <EinstellungenView
            theme={theme}
            pharmacyId={pharmacyId}
            profiles={profilesHook.profiles}
          />
        )
      case 'statistiken':
        return (
          <StatistikenView
            theme={theme}
            pharmacyId={pharmacyId}
            profiles={profilesHook.profiles}
          />
        )
      case 'info':
        return (
          <InfoView
            theme={theme}
            pharmacyId={pharmacyId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#DC2626] text-white'
                  : `${theme.surface} border ${theme.border} ${theme.textSecondary} hover:bg-gray-50`
              }`}
            >
              <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
