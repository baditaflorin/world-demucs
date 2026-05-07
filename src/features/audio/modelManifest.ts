import { z } from 'zod'

const modelStatusSchema = z.enum(['bundled', 'external', 'placeholder'])

const modelEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  status: modelStatusSchema,
  url: z.string().url().nullable(),
  license: z.string(),
  sampleRate: z.number().positive(),
  segmentSeconds: z.number().positive(),
  stems: z.array(z.string()).min(1),
  notes: z.string(),
})

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  defaultModelId: z.string(),
  fallbackMode: z.string(),
  models: z.array(modelEntrySchema).min(1),
})

export type ModelManifest = z.infer<typeof manifestSchema>
export type ModelEntry = z.infer<typeof modelEntrySchema>

export async function loadModelManifest(): Promise<ModelManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}models/demucs-manifest.json`, {
    cache: 'no-cache',
  })

  if (!response.ok) {
    throw new Error(`Model manifest failed with HTTP ${response.status}`)
  }

  return manifestSchema.parse(await response.json())
}

export function getDefaultModel(manifest: ModelManifest): ModelEntry {
  return manifest.models.find((model) => model.id === manifest.defaultModelId) ?? manifest.models[0]
}
