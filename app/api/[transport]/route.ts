import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'

const URL = `${process.env.LANGSEARCH_BASE_URL}/v1/web-search`

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'search_web',
      'Searches the web',
      {
        maxResults: z.number().int().min(1).max(10).optional(),
        query: z.string().min(2).max(100),
      },
      async ({ maxResults, query }) => {
        const results = await fetch(URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.LANGSEARCH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            count: maxResults ?? 5, // Default to 5 if not provided
            summary: true,
          }),
        })
        return await results.json()
      },
    )
  },
  {
    capabilities: {
      tools: {
        search_web: {
          description: 'Searches the web',
        },
      },
    },
  },
  {
    // Optional redis config
    redisUrl: process.env.REDIS_URL,
    basePath: '/api', // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  },
)

export { handler as GET, handler as POST }
