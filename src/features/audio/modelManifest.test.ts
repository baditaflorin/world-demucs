import { describe, expect, it, vi } from 'vitest'
import { getDefaultModel, loadModelManifest } from './modelManifest'

describe('model manifest', () => {
  it('loads the default model contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          schemaVersion: 1,
          generatedAt: '2026-05-08T00:00:00Z',
          defaultModelId: 'proxy',
          fallbackMode: 'proxy',
          models: [
            {
              id: 'proxy',
              label: 'Proxy',
              status: 'placeholder',
              url: null,
              license: 'MIT',
              sampleRate: 48000,
              segmentSeconds: 0.043,
              stems: ['vocals'],
              notes: 'test',
            },
          ],
        }),
      })),
    )

    const manifest = await loadModelManifest()
    expect(getDefaultModel(manifest).id).toBe('proxy')
    vi.unstubAllGlobals()
  })
})
