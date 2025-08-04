import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'

const URL = `${process.env.LANGSEARCH_BASE_URL}/v1/web-search`

// Define the output schema for structured content
const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
  datePublished: z.string().optional(),
})

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_web',
      {
        description: 'Searches the web and returns structured results',
        inputSchema: {
          maxResults: z.number().int().min(1).max(10).optional(),
          query: z.string().min(2).max(100),
        },
        outputSchema: {
          query: z.string(),
          totalResults: z.number(),
          results: z.array(searchResultSchema),
        },
      },
      async ({ maxResults, query }) => {
        const res = await fetch(URL, {
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
        const results = await res.json()

        console.log(
          `Found ${
            results.data?.webPages?.value?.length || 0
          } results for query: "${query}"`,
        )

        // Structure the output for better readability and consistency
        const webPages = results.data?.webPages?.value ?? []

        // Map the API response to our structured schema
        const structuredResults: Array<z.infer<typeof searchResultSchema>> =
          webPages.map((page: any) => ({
            title: page.name || 'No title',
            url: page.url || '',
            ...(page.summary && { summary: page.summary }),
            ...(page.datePublished && { datePublished: page.datePublished }),
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
