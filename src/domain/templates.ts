import { z } from 'zod'
import type { DentalTemplate, StandardRatio } from './types'

const ratioValues = ['1:1', '4:5', '3:4', '2:3'] as const

const templateInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(60),
  ratio: z.enum(ratioValues),
  width: z.number().int().min(320).max(8000),
  eyeLineY: z.number().min(0.2).max(0.62),
  noseX: z.number().min(0.3).max(0.7),
  noseY: z.number().min(0.35).max(0.82),
  targetEyeDistanceRatio: z.number().min(0.2).max(0.65).default(0.38),
  safeTop: z.number().min(0).max(0.3).default(0.08),
  safeBottom: z.number().min(0).max(0.3).default(0.08),
  builtIn: z.boolean().default(false),
})

const ratioParts: Record<StandardRatio, readonly [number, number]> = {
  '1:1': [1, 1],
  '4:5': [4, 5],
  '3:4': [3, 4],
  '2:3': [2, 3],
}

type TemplateInput = z.input<typeof templateInputSchema>

function templateId(name: string, ratio: StandardRatio) {
  return `${ratio.replace(':', 'x')}-${name.trim().toLowerCase().replace(/\s+/g, '-')}`
}

export function parseTemplate(input: TemplateInput): DentalTemplate {
  const result = templateInputSchema.safeParse(input)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    throw new Error(`模板参数无效：${firstIssue?.message ?? '请检查输入'}`)
  }

  const value = result.data
  const [ratioWidth, ratioHeight] = ratioParts[value.ratio]

  return {
    id: value.id ?? templateId(value.name, value.ratio),
    name: value.name,
    ratio: value.ratio,
    outputWidth: value.width,
    outputHeight: Math.round((value.width * ratioHeight) / ratioWidth),
    eyeLineY: value.eyeLineY,
    noseX: value.noseX,
    noseY: value.noseY,
    targetEyeDistanceRatio: value.targetEyeDistanceRatio,
    safeTop: value.safeTop,
    safeBottom: value.safeBottom,
    builtIn: value.builtIn,
  }
}

export const BUILT_IN_TEMPLATES: readonly DentalTemplate[] = [
  parseTemplate({ name: '方形正面照', ratio: '1:1', width: 1600, eyeLineY: 0.34, noseX: 0.5, noseY: 0.57, builtIn: true }),
  parseTemplate({ name: '牙科正面照', ratio: '4:5', width: 1600, eyeLineY: 1 / 3, noseX: 0.5, noseY: 0.56, builtIn: true }),
  parseTemplate({ name: '标准竖版', ratio: '3:4', width: 1500, eyeLineY: 0.34, noseX: 0.5, noseY: 0.56, builtIn: true }),
  parseTemplate({ name: '全脸竖版', ratio: '2:3', width: 1400, eyeLineY: 0.35, noseX: 0.5, noseY: 0.54, builtIn: true }),
]
