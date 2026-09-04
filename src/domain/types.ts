export type StandardRatio = '1:1' | '4:5' | '3:4' | '2:3'

export type NormalizedPoint = Readonly<{
  x: number
  y: number
}>

export type LandmarkSet = Readonly<{
  leftEye: NormalizedPoint
  rightEye: NormalizedPoint
  nose: NormalizedPoint
  faceOval: readonly NormalizedPoint[]
  confidence: number
  faceCount: number
}>

export type DentalTemplate = Readonly<{
  id: string
  name: string
  ratio: StandardRatio
  outputWidth: number
  outputHeight: number
  eyeLineY: number
  noseX: number
  noseY: number
  targetEyeDistanceRatio: number
  safeTop: number
  safeBottom: number
  builtIn: boolean
}>

export type PhotoStatus =
  | 'pending'
  | 'analyzing'
  | 'ready'
  | 'needs-review'
  | 'reviewed'
  | 'exporting'
  | 'exported'
  | 'failed'

export type PhotoTask = Readonly<{
  id: string
  sourcePath: string
  displayName: string
  status: PhotoStatus
  landmarks?: LandmarkSet
  outputPath?: string
  error?: string
}>

export type CommandPatch = Readonly<{
  straighten?: boolean
  ratio?: StandardRatio
  eyeLineY?: number
  outputWidth?: number
  noseX?: number
  noseY?: number
}>

export type CommandParseResult = Readonly<{
  patch: CommandPatch
  recognized: readonly string[]
  unrecognized: readonly string[]
}>

export type AffineMatrix = Readonly<{
  a: number
  b: number
  c: number
  d: number
  tx: number
  ty: number
}>

export type ReviewReason =
  | 'no-face'
  | 'multiple-faces'
  | 'low-confidence'
  | 'face-too-small'
  | 'insufficient-source-coverage'
  | 'nose-position-mismatch'

export type TransformPlan = Readonly<{
  matrix: AffineMatrix
  rotationDegrees: number
  scale: number
  outputWidth: number
  outputHeight: number
  requiresManualReview: boolean
  reviewReasons: readonly ReviewReason[]
}>
