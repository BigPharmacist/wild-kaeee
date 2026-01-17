import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  name: '',
  street: '',
  postalCode: '',
  city: '',
  phone: '',
  owner: '',
  ownerRole: '',
  website: '',
  email: '',
  fax: '',
  vatId: '',
  tradeRegister: '',
  registryCourt: '',
  bgaIdfNumber: '',
}

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState([])
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false)
  const [pharmaciesMessage, setPharmaciesMessage] = useState('')
  const [editingPharmacy, setEditingPharmacy] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  const fetchPharmacies = async () => {
    setPharmaciesLoading(true)
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, name, street, postal_code, city, phone, owner, owner_role, website, email, fax, vat_id, trade_register, registry_court, bga_idf_number')
      .order('name', { ascending: true })

    if (error) {
      setPharmaciesMessage(error.message)
      setPharmacies([])
    } else {
      setPharmaciesMessage('')
      setPharmacies(data || [])
    }
    setPharmaciesLoading(false)
  }

  const handleEditInput = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreateModal = () => {
    setEditingPharmacy({ id: null })
    setEditMessage('')
    setEditForm(emptyForm)
  }

  const openEditModal = (pharmacy) => {
    setEditingPharmacy(pharmacy)
    setEditMessage('')
    setEditForm({
      name: pharmacy.name || '',
      street: pharmacy.street || '',
      postalCode: pharmacy.postal_code || '',
      city: pharmacy.city || '',
      phone: pharmacy.phone || '',
      owner: pharmacy.owner || '',
      ownerRole: pharmacy.owner_role || '',
      website: pharmacy.website || '',
      email: pharmacy.email || '',
      fax: pharmacy.fax || '',
      vatId: pharmacy.vat_id || '',
      tradeRegister: pharmacy.trade_register || '',
      registryCourt: pharmacy.registry_court || '',
      bgaIdfNumber: pharmacy.bga_idf_number || '',
    })
  }

  const closeEditModal = () => {
    setEditingPharmacy(null)
    setEditMessage('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingPharmacy) return
    if (!editingPharmacy.id && pharmacies.length >= 4) {
      setEditMessage('Maximal 4 Apotheken erlaubt.')
      return
    }
    if (!editForm.name.trim()) {
      setEditMessage('Bitte einen Namen eingeben.')
      return
    }
    if (!editForm.ownerRole) {
      setEditMessage('Bitte Inhaber oder Filialleiter wählen.')
      return
    }

    setEditLoading(true)
    const payload = {
      name: editForm.name.trim(),
      street: editForm.street.trim(),
      postal_code: editForm.postalCode.trim(),
      city: editForm.city.trim(),
      phone: editForm.phone.trim(),
      owner: editForm.owner.trim(),
      owner_role: editForm.ownerRole,
      website: editForm.website.trim(),
      email: editForm.email.trim(),
      fax: editForm.fax.trim(),
      vat_id: editForm.vatId.trim(),
      trade_register: editForm.tradeRegister.trim(),
      registry_court: editForm.registryCourt.trim(),
      bga_idf_number: editForm.bgaIdfNumber.trim(),
    }

    const { error } = editingPharmacy.id
      ? await supabase
          .from('pharmacies')
          .update(payload)
          .eq('id', editingPharmacy.id)
      : await supabase
          .from('pharmacies')
          .insert(payload)

    if (error) {
      setEditMessage(error.message)
      setEditLoading(false)
      return
    }

    await fetchPharmacies()
    setEditLoading(false)
    closeEditModal()
  }

  // Lookup-Objekt für schnellen Zugriff: { id: name }
  const pharmacyLookup = Object.fromEntries(
    pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.name])
  )

  return {
    // State
    pharmacies,
    pharmaciesLoading,
    pharmaciesMessage,
    editingPharmacy,
    editForm,
    editLoading,
    editMessage,
    pharmacyLookup,
    // Actions
    fetchPharmacies,
    handleEditInput,
    openCreateModal,
    openEditModal,
    closeEditModal,
    handleEditSubmit,
  }
}
