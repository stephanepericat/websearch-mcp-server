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

  // const result = await client.request(
  //   { method: 'roll_dice', params: { sides: 6 } },
  //   // {
  //   //   content: [{ type: 'text', text: 'Rolling a 6-sided die...' }],
  //   // },
  // )

  client.close()
}

main()
