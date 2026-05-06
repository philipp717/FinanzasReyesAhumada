import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })

const indexName = process.env.PINECONE_INDEX_NAME ?? 'finanzas-RA'

const existing = await pinecone.listIndexes()
const exists = existing.indexes?.some((i) => i.name === indexName)

if (exists) {
  console.log(`Índice "${indexName}" ya existe.`)
} else {
  console.log(`Creando índice "${indexName}"...`)
  await pinecone.createIndex({
    name: indexName,
    dimension: 768,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
  })
  console.log('Índice creado correctamente.')
}
