import type {
  CommandParseResult,
  CommandPatch,
  StandardRatio,
} from './types'

const supportedRatios = new Set<StandardRatio>(['1:1', '4:5', '3:4', '2:3'])

function normalizeClause(value: string) {
  return value.trim().replace(/[。！？!?]+$/g, '')
}

export function parseOfflineCommand(command: string): CommandParseResult {
  const clauses = command
    .split(/[，,；;。\n]+/)
    .map(normalizeClause)
    .filter(Boolean)

  const patch: {
    straighten?: boolean
    ratio?: StandardRatio
    eyeLineY?: number
    outputWidth?: number
    noseX?: number
    noseY?: number
  } = {}
  const unrecognized: string[] = []

  let recognizedStraighten = false
  let recognizedRatio: StandardRatio | undefined
  let recognizedEyeLine: string | undefined
  let recognizedWidth: number | undefined
  let recognizedNoseCenter = false

  for (const clause of clauses) {
    let matched = false

    if (/(摆正|扶正|头位.*正|校正.*倾斜|纠正.*倾斜)/.test(clause)) {
      patch.straighten = true
      recognizedStraighten = true
      matched = true
    }

    const ratioMatch = clause.match(/([1-9])\s*[:：]\s*([1-9])/) 
    if (ratioMatch) {
      const ratio = `${ratioMatch[1]}:${ratioMatch[2]}` as StandardRatio
      if (supportedRatios.has(ratio)) {
        patch.ratio = ratio
        recognizedRatio = ratio
        matched = true
      }
    }

    if (/(眼睛|双眼|眼线)/.test(clause)) {
      if (/(上方九宫格|上三分|上方三分|第一条)/.test(clause)) {
        patch.eyeLineY = 1 / 3
        recognizedEyeLine = '眼线位于上方三分线'
        matched = true
      } else if (/(中间|居中|中线)/.test(clause)) {
        patch.eyeLineY = 0.5
        recognizedEyeLine = '眼线垂直居中'
        matched = true
      }
    }

    const widthMatch = clause.match(/(?:输出)?宽度\s*(\d{3,4})\s*(?:像素|px)?/i)
    if (widthMatch) {
      patch.outputWidth = Number(widthMatch[1])
      recognizedWidth = patch.outputWidth
      matched = true
    }

    if (/(鼻尖|鼻子).*(居中|中间)/.test(clause)) {
      patch.noseX = 0.5
      recognizedNoseCenter = true
      matched = true
    }

    if (!matched) unrecognized.push(clause)
  }

  const recognized: string[] = []
  if (recognizedStraighten) recognized.push('自动摆正头位')
  if (recognizedRatio) recognized.push(`输出比例 ${recognizedRatio}`)
  if (recognizedEyeLine) recognized.push(recognizedEyeLine)
  if (recognizedWidth) recognized.push(`输出宽度 ${recognizedWidth} 像素`)
  if (recognizedNoseCenter) recognized.push('鼻尖水平居中')

  return {
    patch: patch satisfies CommandPatch,
    recognized,
    unrecognized,
  }
}
