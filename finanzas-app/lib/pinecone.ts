import { Pinecone } from '@pinecone-database/pinecone'

let client: Pinecone | null = null

function getClient(): Pinecone {
  if (!client) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY no configurada')
    }
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  }
  return client
}

export const getIndex = () =>
  getClient().index(process.env.PINECONE_INDEX_NAME ?? 'finanzas-familiar')

export async function upsertTransaction(
  userId: string,
  transactionId: string,
  embedding: number[],
  metadata: Record<string, string | number>
) {
  const index = getIndex()
  await index.upsert({
    records: [
      {
        id: `${userId}-${transactionId}`,
        values: embedding,
        metadata: { userId, transactionId, ...metadata },
      },
    ],
  })
}

export async function queryFinancialContext(
  userId: string,
  queryEmbedding: number[],
  topK = 10
): Promise<string> {
  const index = getIndex()
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter: { userId },
    includeMetadata: true,
  })

  if (!results.matches?.length) return ''

  return results.matches
    .map((m) => {
      const meta = m.metadata as Record<string, string | number>
      return `- ${meta.type} de $${meta.amount} en ${meta.category} el ${meta.date}: ${meta.description}`
    })
    .join('\n')
}

export async function deleteUserVectors(userId: string) {
  const index = getIndex()
  await index.deleteMany({ filter: { userId } })
}
