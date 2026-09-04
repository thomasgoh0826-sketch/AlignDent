import { describe, expect, it } from 'vitest'
import { BUILT_IN_TEMPLATES, parseTemplate } from '../../src/domain/templates'

describe('dental templates', () => {
  it('derives an exact output height from a named ratio', () => {
    const template = parseTemplate({
      name: '诊所正面照',
      ratio: '4:5',
      width: 1600,
      eyeLineY: 1 / 3,
      noseX: 0.5,
      noseY: 0.56,
    })

    expect(template.outputWidth).toBe(1600)
    expect(template.outputHeight).toBe(2000)
    expect(template.ratio).toBe('4:5')
  })

  it('rejects unsafe dimensions and landmark positions', () => {
    expect(() =>
      parseTemplate({
        name: '无效模板',
        ratio: '4:5',
        width: 50,
        eyeLineY: 2,
        noseX: 0.5,
        noseY: 0.56,
      }),
    ).toThrow('模板参数无效')
  })

  it('ships the four promised ratio presets', () => {
    expect(BUILT_IN_TEMPLATES.map((template) => template.ratio)).toEqual([
      '1:1',
      '4:5',
      '3:4',
      '2:3',
    ])
  })
})
