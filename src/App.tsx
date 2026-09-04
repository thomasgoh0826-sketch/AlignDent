import { useCallback, useEffect, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import type { DentalTemplate, LandmarkSet } from './domain/types'
import { EmptyState } from './features/import/EmptyState'
import { UrlImportDialog } from './features/import/UrlImportDialog'
import { LicenseScreen } from './features/license/LicenseScreen'
import { Inspector } from './features/workspace/Inspector'
import { PhotoQueue } from './features/workspace/PhotoQueue'
import { PhotoStage } from './features/workspace/PhotoStage'
import { getFileGateway } from './services/fileGateway'
import { LocalFaceProcessor } from './services/localFaceProcessor'
import { useWorkspaceStore, type WorkspacePhoto } from './store/useWorkspaceStore'
import { planTransform } from './vision/transformPlanner'

const IS_COMMUNITY_EDITION = import.meta.env.VITE_COMMUNITY_EDITION !== 'false'

export function App() {
  const [licenseOpen, setLicenseOpen] = useState(false)
  const [urlImportOpen, setUrlImportOpen] = useState(false)
  const [deviceCode, setDeviceCode] = useState('AD-DEMO-LOCAL')
  const [licensed, setLicensed] = useState(IS_COMMUNITY_EDITION)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const cancelRequested = useRef(false)
  const {
    photos, activePhotoId, gridVisible, viewMode, theme, activeTemplate, lastCommandApplied,
    loadDemo, importPaths, selectPhoto, markReviewed, updatePhoto, toggleGrid, setViewMode,
    toggleTheme, applyCommand, selectRatio, setTemplateValue, reset,
    restoreWorkspace,
  } = useWorkspaceStore()
  const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? photos[0]

  useEffect(() => {
    if (IS_COMMUNITY_EDITION) return
    void window.alignDent?.license?.status().then((status) => {
      setDeviceCode(status.deviceCode)
      setLicensed(status.licensed)
    })
  }, [])

  useEffect(() => {
    void window.alignDent?.jobs?.load().then(async (value) => {
      if (!value || typeof value !== 'object') return
      const saved = value as { photos?: WorkspacePhoto[]; activeTemplate?: DentalTemplate }
      if (!Array.isArray(saved.photos) || saved.photos.length === 0) return
      const restored = saved.photos.filter((photo) => photo && typeof photo.sourcePath === 'string' && typeof photo.name === 'string')
      restoreWorkspace(restored, saved.activeTemplate)
      const readPreview = getFileGateway().readPreview
      if (!readPreview) return
      await Promise.all(restored.filter((photo) => !photo.isDemo).map(async (photo) => {
        try { updatePhoto(photo.id, { previewUrl: await readPreview(photo.sourcePath) }) } catch { updatePhoto(photo.id, { status: 'failed', error: '原图已移动，请重新导入' }) }
      }))
    })
  }, [restoreWorkspace, updatePhoto])

  useEffect(() => {
    if (!photos.length || !window.alignDent?.jobs) return
    const persistedPhotos = photos.map((photo) => Object.fromEntries(Object.entries(photo).filter(([key]) => key !== 'previewUrl')))
    void window.alignDent.jobs.save({ version: 1, photos: persistedPhotos, activeTemplate, updatedAt: new Date().toISOString() })
  }, [photos, activeTemplate])

  const importAndPreview = useCallback(async (paths: string[]) => {
    const accepted = licensed ? paths : paths.slice(0, 3)
    if (accepted.length === 0) return
    importPaths(accepted)
    const readPreview = getFileGateway().readPreview
    if (!readPreview) return
    await Promise.all(accepted.map(async (sourcePath) => {
      const photo = () => useWorkspaceStore.getState().photos.find((item) => item.sourcePath === sourcePath)
      try {
        const previewUrl = await readPreview(sourcePath)
        if (photo()) updatePhoto(photo()!.id, { previewUrl })
      } catch (error) {
        if (photo()) updatePhoto(photo()!.id, { status: 'failed', error: error instanceof Error ? error.message : '无法读取预览' })
      }
    }))
  }, [importPaths, licensed, updatePhoto])

  const handleImport = useCallback(async () => importAndPreview(await getFileGateway().chooseImages()), [importAndPreview])
  const handleImportFolder = useCallback(async () => importAndPreview(await getFileGateway().chooseFolder()), [importAndPreview])

  const handleProcess = useCallback(async () => {
    const pending = useWorkspaceStore.getState().photos.filter((photo) => photo.status === 'pending')
    if (!pending.length) return
    cancelRequested.current = false
    setProcessing(true)
    setProgress({ done: 0, total: pending.length })
    const processor = new LocalFaceProcessor()
    let cursor = 0
    let done = 0
    const worker = async () => {
      while (!cancelRequested.current) {
        const photo = pending[cursor++]
        if (!photo) return
        if (!photo.previewUrl) {
          updatePhoto(photo.id, { status: 'failed', error: '无法读取图片预览，请重新导入' })
          done += 1
          setProgress({ done, total: pending.length })
          continue
        }
        updatePhoto(photo.id, { status: 'analyzing', error: undefined })
        try {
          const result = await processor.analyze(photo.id, photo.previewUrl)
          const transformPlan = planTransform({ ...result, template: activeTemplate })
          updatePhoto(photo.id, { ...result, transformPlan, status: transformPlan.requiresManualReview ? 'needs-review' : 'ready' })
        } catch (error) {
          updatePhoto(photo.id, { status: 'failed', error: error instanceof Error ? error.message : '本地识别失败' })
        }
        done += 1
        setProgress({ done, total: pending.length })
      }
    }
    await Promise.all([worker(), worker()])
    processor.dispose()
    setProcessing(false)
  }, [activeTemplate, updatePhoto])

  const handleExport = useCallback(async () => {
    const bridge = window.alignDent
    const outputDirectory = await bridge?.files?.chooseExportFolder?.()
    if (!outputDirectory || !bridge?.export) return
    const candidates = useWorkspaceStore.getState().photos.filter((photo) => ['ready', 'reviewed'].includes(photo.status))
    await Promise.all(candidates.map(async (photo) => {
      if (photo.isDemo || !photo.transformPlan) {
        if (photo.isDemo) updatePhoto(photo.id, { status: 'exported' })
        return
      }
      try {
        const outputPath = await bridge.export!.image({
          sourcePath: photo.sourcePath, sourceName: photo.name, outputDirectory,
          outputWidth: photo.transformPlan.outputWidth, outputHeight: photo.transformPlan.outputHeight,
          matrix: photo.transformPlan.matrix, format: 'jpeg', quality: 94,
        })
        updatePhoto(photo.id, { status: 'exported', outputPath })
      } catch (error) {
        updatePhoto(photo.id, { status: 'failed', error: error instanceof Error ? error.message : '导出失败' })
      }
    }))
  }, [updatePhoto])

  const updateActiveLandmarks = useCallback((landmarks: LandmarkSet) => {
    const state = useWorkspaceStore.getState()
    const photo = state.photos.find((item) => item.id === state.activePhotoId)
    if (!photo?.sourceWidth || !photo.sourceHeight) return
    const transformPlan = planTransform({ sourceWidth: photo.sourceWidth, sourceHeight: photo.sourceHeight, landmarks, template: activeTemplate })
    updatePhoto(photo.id, { landmarks, transformPlan })
  }, [activeTemplate, updatePhoto])

  const hasPending = photos.some((photo) => photo.status === 'pending')
  return (
    <div className="app-shell" data-theme={theme}>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <Sidebar onNewTask={reset} onLicense={() => setLicenseOpen(true)} showLicense={!IS_COMMUNITY_EDITION} />
      <div className="app-main">
        <TopBar theme={theme} onToggleTheme={toggleTheme} onApplyCommand={applyCommand} statusMessage={lastCommandApplied} />
        <main id="main-content" className={photos.length > 0 ? 'main-content has-photos' : 'main-content'}>
          {photos.length === 0 ? <EmptyState onImport={handleImport} onImportFolder={handleImportFolder} onDemo={loadDemo} onUrlImport={() => setUrlImportOpen(true)} /> : <div className="workspace-center">
            {activePhoto && <PhotoStage photo={activePhoto} gridVisible={gridVisible} viewMode={viewMode} safeTop={activeTemplate.safeTop} safeBottom={activeTemplate.safeBottom} onToggleGrid={toggleGrid} onViewMode={setViewMode} onLandmarksChange={updateActiveLandmarks} onConfirm={() => markReviewed(activePhoto.id)} onReanalyze={() => { updatePhoto(activePhoto.id, { status: 'pending' }); void handleProcess() }} />}
            <PhotoQueue photos={photos} activeId={activePhotoId} onSelect={selectPhoto} />
          </div>}
        </main>
      </div>
      {photos.length > 0 && <Inspector photos={photos} template={activeTemplate} onRatio={selectRatio} onTemplateValue={setTemplateValue} processing={processing} progress={progress} onPrimary={hasPending ? handleProcess : handleExport} onCancel={() => { cancelRequested.current = true }} />}
      {licenseOpen && <LicenseScreen deviceCode={deviceCode} onClose={() => setLicenseOpen(false)} onActivate={async (token) => {
        const result = await window.alignDent?.license?.activate(token) ?? { ok: false as const }
        if (result.ok) setLicensed(true)
        return result
      }} />}
      {urlImportOpen && <UrlImportDialog onClose={() => setUrlImportOpen(false)} onDownload={async (urls) => {
        const paths = await window.alignDent?.downloads?.images(urls) ?? []
        await importAndPreview(paths)
        if (paths.length) setUrlImportOpen(false)
        return paths
      }} />}
    </div>
  )
}
