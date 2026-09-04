import { z } from 'zod'
import { parseOfflineCommand } from '../../src/domain/commandParser'
import type { CommandPatch } from '../../src/domain/types'
import type { IpcMain } from 'electron'
import { loadPrivateApiSettings } from './settings'

export type ApiCommandSettings = Readonly<{
  baseUrl: string
  model: string
  apiKey: string
}>

const commandPatchSchema = z.object({
  straighten: z.boolean().optional(),
  ratio: z.enum(['1:1', '4:5', '3:4', '2:3']).optional(),
  eyeLineY: z.number().min(0.2).max(0.62).optional(),
  outputWidth: z.number().int().min(320).max(8000).optional(),
  noseX: z.number().min(0.3).max(0.7).optional(),
  noseY: z.number().min(0.35).max(0.82).optional(),
}).strict()

export function validateApiBaseUrl(input: string): { ok: true } | { ok: false; message: string } {
  try {
    const url = new URL(input)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
      return { ok: false, message: '远程 API 地址必须使用 HTTPS' }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'API 地址格式不正确' }
  }
}

export function buildTextCommandRequest(command: string, model: string) {
  return {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: '把牙科照片排版要求转换成 JSON。仅允许字段 straighten, ratio, eyeLineY, outputWidth, noseX, noseY。不要输出其他内容。' },
      { role: 'user', content: command },
    ],
  }
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

export async function parseCommandWithApi(command: string, settings: ApiCommandSettings, fetcher: FetchLike = fetch) {
  const validation = validateApiBaseUrl(settings.baseUrl)
  if (!validation.ok) throw new Error(validation.message)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetcher(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify(buildTextCommandRequest(command, settings.model)),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('API 请求失败')
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = payload.choices?.[0]?.message?.content
    if (!content) throw new Error('API 没有返回可用结果')
    return commandPatchSchema.parse(JSON.parse(content)) satisfies CommandPatch
  } finally {
    clearTimeout(timeout)
  }
}

export async function parseCommandWithFallback(command: string, settings?: ApiCommandSettings, fetcher?: FetchLike) {
  if (settings) {
    try {
      return { patch: await parseCommandWithApi(command, settings, fetcher), source: 'api' as const }
    } catch {
      // The offline parser remains available when the optional provider is unavailable.
    }
  }
  return { patch: parseOfflineCommand(command).patch, source: 'offline' as const }
}

export function registerApiHandlers(ipc: IpcMain, settingsPath: string) {
  ipc.handle('api:parse-command', async (_event, command: string) => {
    const settings = await loadPrivateApiSettings(settingsPath)
    return parseCommandWithFallback(command, settings)
  })
}
