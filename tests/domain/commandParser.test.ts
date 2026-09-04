import { describe, expect, it } from 'vitest'
import { parseOfflineCommand } from '../../src/domain/commandParser'

describe('offline Chinese command parser', () => {
  it('maps a common dental instruction to explicit template values', () => {
    const result = parseOfflineCommand(
      '摆正头位，眼睛放在上方九宫格线，裁成 4:5',
    )

    expect(result.patch).toEqual({
      straighten: true,
      ratio: '4:5',
      eyeLineY: 1 / 3,
    })
    expect(result.recognized).toEqual([
      '自动摆正头位',
      '输出比例 4:5',
      '眼线位于上方三分线',
    ])
    expect(result.unrecognized).toEqual([])
  })

  it('keeps unknown clauses visible instead of guessing', () => {
    const result = parseOfflineCommand('裁成 1:1，笑容更自然')

    expect(result.patch).toEqual({ ratio: '1:1' })
    expect(result.unrecognized).toEqual(['笑容更自然'])
  })

  it('understands explicit pixels and nose centering', () => {
    const result = parseOfflineCommand('输出宽度 1200 像素，鼻尖居中')

    expect(result.patch).toEqual({ outputWidth: 1200, noseX: 0.5 })
  })
})
