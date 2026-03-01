import 'dotenv/config';
import { EmbeddingsService } from './embeddings.service';

async function main() {
  const service = new EmbeddingsService();
  console.log('Starting embeddings indexing...');
  const result = await service.indexStandards();
  console.log(`Done. Indexed: ${result.indexed}, Skipped: ${result.skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to index embeddings:', err);
  process.exit(1);
});
