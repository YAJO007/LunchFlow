import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Store } from '../src/types.ts';
import { createSeedStore } from './seed.ts';

const storePath = resolve(process.cwd(), 'data', 'store.json');
let cache: Store | undefined;

export async function readStore(): Promise<Store> {
  if (cache) return cache;

  try {
    cache = JSON.parse(await readFile(storePath, 'utf8')) as Store;
  } catch {
    cache = createSeedStore();
    await saveStore(cache);
  }

  return cache;
}

export async function saveStore(store: Store): Promise<void> {
  cache = store;
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}
