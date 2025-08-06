import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'

const URL = `${process.env.BRAVE_SEARCH_BASE_URL}/res/v1/web/search`

// Define the output schema for structured content
const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string(),
  snippets: z.array(z.string()).optional(),
  published: z.string().optional(),
  thumbnail: z.string().optional(),
})

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_web',
      {
        description: 'Searches the web and returns structured results',
        inputSchema: {
          maxResults: z.number().int().min(1).max(10).optional(),
          query: z.string().min(2).max(500),
        },
        outputSchema: {
          query: z.string(),
          totalResults: z.number(),
          results: z.array(searchResultSchema),
        },
      },
      async ({ maxResults, query }) => {
        const params = new URLSearchParams({
          q: query,
          count: (maxResults ?? 5).toString(), // Default to 5 if not provided
          freshness: 'pd',
        })

        const endpoint = `${URL}?${params.toString()}`
        console.log('Searching the web with Brave Search API:', endpoint)

        try {
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'X-Subscription-Token': `${process.env.BRAVE_SEARCH_API_KEY}`,
              Accept: 'application/json',
              'Accept-Encoding': 'gzip',
            },
          })

          const data = await res.json()

          console.log(
            `Found ${
              data.web?.results?.length || 0
            } results for query: "${query}"`,
          )

          // Structure the output for better readability and consistency
          const webPages = data.web?.results ?? []

          // console.log(JSON.stringify(webPages, null, 2))

          // Map the API response to our structured schema
          const structuredResults: Array<z.infer<typeof searchResultSchema>> =
            webPages.map((page: any) => ({
              title: page.title || 'No title',
              url: page.url || '',
              description: page.description || '',
              snippets: page.extra_snippets || [],
              published: page.page_age || '',
              thumbnail: page.thumbnail.src || '',
            }))

          // Return both content and structuredContent since we have an outputSchema defined
          return {
            content: [
              {
                type: 'text' as const,
                text: `Found ${structuredResults.length} search results for: "${query}"`,
              },
            ],
            structuredContent: {
              query,
              totalResults: structuredResults.length,
              results: structuredResults,
            },
          }
        } catch (error) {
          console.error(error)
          throw error
        }
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
