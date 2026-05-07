import { z } from 'zod'

const commitSchema = z.object({
  sha: z.string(),
  html_url: z.string().url(),
})

export interface LatestCommit {
  sha: string
  shortSha: string
  url: string
}

export async function fetchLatestCommit(): Promise<LatestCommit> {
  const response = await fetch('https://api.github.com/repos/baditaflorin/world-demucs/commits/main', {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub commit lookup failed with HTTP ${response.status}`)
  }

  const commit = commitSchema.parse(await response.json())
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 12),
    url: commit.html_url,
  }
}
