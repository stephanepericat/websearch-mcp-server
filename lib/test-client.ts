import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const origin = 'http://localhost:3000'

async function main() {
  const transport = new SSEClientTransport(new URL(`${origin}/api/sse`), {})

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    },
  )

  console.log('Connecting to', origin)
  await client.connect(transport)

  console.log('Connected', client.getServerCapabilities())

  const list = await client.listTools()
  console.log(list)

  const result = await client.callTool({
    name: 'roll_dice',
    arguments: {
      sides: 6,
    },
  })
  console.log('Tool result:', result)

  client.close()
}

main()
