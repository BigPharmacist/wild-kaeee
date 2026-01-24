import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function useProjects({ session, currentStaff }) {
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState('')

  // Edit modal state
  const [editingProject, setEditingProject] = useState(null)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    deadline: '',
  })
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectSaveError, setProjectSaveError] = useState('')

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    if (!session?.user?.id) return
    setProjectsLoading(true)
    setProjectsError('')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      setProjectsError(error.message)
      setProjects([])
    } else {
      setProjects(data || [])
    }
    setProjectsLoading(false)
  }, [session])

  // Open project modal
  const openProjectModal = (project = null) => {
    setEditingProject(project || { id: null })
    setProjectSaveError('')
    setProjectForm({
      name: project?.name || '',
      description: project?.description || '',
      color: project?.color || '#6366f1',
      deadline: project?.deadline || '',
    })
  }

  // Close project modal
  const closeProjectModal = () => {
    setEditingProject(null)
    setProjectSaveError('')
  }

  // Handle form input
  const handleProjectInput = (field, value) => {
    setProjectForm(prev => ({ ...prev, [field]: value }))
  }

  // Save project
  const saveProject = async () => {
    if (!projectForm.name.trim()) {
      setProjectSaveError('Projektname erforderlich')
      return false
    }

    setProjectSaving(true)
    setProjectSaveError('')

    const projectData = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
      color: projectForm.color,
      deadline: projectForm.deadline || null,
      updated_at: new Date().toISOString(),
    }

    let success
    if (editingProject?.id) {
      // Update
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id)

      success = !error
      if (error) setProjectSaveError(error.message)

      if (success) {
        setProjects(prev => prev.map(p =>
          p.id === editingProject.id ? { ...p, ...projectData } : p
        ))
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          created_by: currentStaff?.id,
        })
        .select()
        .single()

      success = !error
      if (error) setProjectSaveError(error.message)

      if (success && data) {
        setProjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }

    setProjectSaving(false)
    if (success) closeProjectModal()
    return success
  }

  // Archive project (soft delete)
  const archiveProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (error) {
      setProjectsError(error.message)
      return false
    }

    setProjects(prev => prev.filter(p => p.id !== projectId))
    return true
  }

  // Delete project permanently
  const deleteProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      setProjectsError(error.message)
      return false
    }

    setProjects(prev => prev.filter(p => p.id !== projectId))
    return true
  }

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session, fetchProjects])

  // Realtime subscription
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('projects_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.new.status === 'active') {
          setProjects(prev => {
            if (prev.some(p => p.id === payload.new.id)) return prev
            return [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name))
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.new.status === 'active') {
          setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        } else {
          setProjects(prev => prev.filter(p => p.id !== payload.new.id))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, (payload) => {
        setProjects(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  return {
    projects,
    projectsLoading,
    projectsError,

    // Modal
    editingProject,
    projectForm,
    projectSaving,
    projectSaveError,
    openProjectModal,
    closeProjectModal,
    handleProjectInput,
    saveProject,

    // Actions
    fetchProjects,
    archiveProject,
    deleteProject,
  }
}
