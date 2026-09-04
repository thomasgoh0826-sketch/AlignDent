import { create } from 'zustand'
import { BUILT_IN_TEMPLATES } from '../domain/templates'
import type { CommandPatch, DentalTemplate } from '../domain/types'
import type { LandmarkSet, TransformPlan } from '../domain/types'
import { planTransform } from '../vision/transformPlanner'

export type WorkspacePhotoStatus =
  | 'pending'
  | 'analyzing'
  | 'ready'
  | 'needs-review'
  | 'reviewed'
  | 'failed'
  | 'exported'

export type WorkspacePhoto = Readonly<{
  id: string
  name: string
  sourcePath: string
  previewUrl?: string
  status: WorkspacePhotoStatus
  isDemo?: boolean
  landmarks?: LandmarkSet
  transformPlan?: TransformPlan
  sourceWidth?: number
  sourceHeight?: number
  outputPath?: string
  error?: string
}>

type ViewMode = 'original' | 'standard'

type WorkspaceState = {
  photos: WorkspacePhoto[]
  activePhotoId?: string
  gridVisible: boolean
  viewMode: ViewMode
  theme: 'light' | 'dark'
  activeTemplate: DentalTemplate
  lastCommandApplied?: string
  loadDemo: () => void
  importPaths: (paths: readonly string[]) => void
  selectPhoto: (id: string) => void
  markReviewed: (id: string) => void
  updatePhoto: (id: string, patch: Partial<WorkspacePhoto>) => void
  toggleGrid: () => void
  setViewMode: (mode: ViewMode) => void
  toggleTheme: () => void
  applyCommand: (patch: CommandPatch) => void
  selectRatio: (ratio: DentalTemplate['ratio']) => void
  setTemplateValue: (field: 'outputWidth' | 'eyeLineY' | 'noseX', value: number) => void
  restoreWorkspace: (photos: WorkspacePhoto[], template?: DentalTemplate) => void
  reset: () => void
}

const initialState = {
  photos: [] as WorkspacePhoto[],
  activePhotoId: undefined as string | undefined,
  gridVisible: true,
  viewMode: 'standard' as ViewMode,
  theme: 'light' as const,
  activeTemplate: BUILT_IN_TEMPLATES[1],
  lastCommandApplied: undefined as string | undefined,
}

function fileName(filePath: string) {
  return filePath.split(/[\\/]/).filter(Boolean).at(-1) ?? filePath
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...initialState,
  loadDemo: () => set((state) => {
    const landmarks: LandmarkSet = {
      leftEye: { x: 0.385, y: 0.345 }, rightEye: { x: 0.615, y: 0.325 }, nose: { x: 0.5, y: 0.515 },
      faceOval: [],
      confidence: 0.99,
      faceCount: 1,
    }
    const sourceWidth = 1024
    const sourceHeight = 1280
    const demo: WorkspacePhoto = {
      id: 'demo-portrait',
      name: '虚构演示正面照.jpg',
      sourcePath: 'demo://portrait',
      previewUrl: './demo/demo-portrait.png',
      status: 'ready',
      isDemo: true,
      landmarks,
      transformPlan: planTransform({ sourceWidth, sourceHeight, landmarks, template: state.activeTemplate }),
      sourceWidth,
      sourceHeight,
    }
    return { photos: [demo], activePhotoId: demo.id, viewMode: 'standard' }
  }),
  importPaths: (paths) => {
    const photos = paths.map((sourcePath, index) => ({
      id: `photo-${Date.now()}-${index}`,
      name: fileName(sourcePath),
      sourcePath,
      status: 'pending' as const,
    }))
    set({ photos, activePhotoId: photos[0]?.id, viewMode: 'original' })
  },
  selectPhoto: (id) => set({ activePhotoId: id }),
  markReviewed: (id) => set((state) => ({
    photos: state.photos.map((photo) => photo.id === id ? { ...photo, status: 'reviewed' } : photo),
  })),
  updatePhoto: (id, patch) => set((state) => ({
    photos: state.photos.map((photo) => photo.id === id ? { ...photo, ...patch } : photo),
  })),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  applyCommand: (patch) => set((state) => {
    const ratio = patch.ratio ?? state.activeTemplate.ratio
    const [ratioWidth, ratioHeight] = ratio.split(':').map(Number)
    const width = patch.outputWidth ?? state.activeTemplate.outputWidth
    return {
      activeTemplate: {
        ...state.activeTemplate,
        ratio,
        outputWidth: width,
        outputHeight: Math.round(width * ratioHeight / ratioWidth),
        eyeLineY: patch.eyeLineY ?? state.activeTemplate.eyeLineY,
        noseX: patch.noseX ?? state.activeTemplate.noseX,
        noseY: patch.noseY ?? state.activeTemplate.noseY,
      },
      lastCommandApplied: '处理标准已更新',
    }
  }),
  selectRatio: (ratio) => set((state) => ({
    activeTemplate: BUILT_IN_TEMPLATES.find((template) => template.ratio === ratio) ?? state.activeTemplate,
  })),
  setTemplateValue: (field, value) => set((state) => {
    const template = { ...state.activeTemplate, [field]: value }
    if (field === 'outputWidth') {
      const [ratioWidth, ratioHeight] = template.ratio.split(':').map(Number)
      template.outputHeight = Math.round(value * ratioHeight / ratioWidth)
    }
    return { activeTemplate: template }
  }),
  restoreWorkspace: (photos, template) => set((state) => ({
    photos: photos.map((photo) => photo.status === 'analyzing' ? { ...photo, status: 'pending' } : photo),
    activePhotoId: photos[0]?.id,
    activeTemplate: template ?? state.activeTemplate,
  })),
  reset: () => set(initialState),
}))
