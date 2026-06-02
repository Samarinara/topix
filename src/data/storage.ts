import {
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import type { Topic, Entry } from './types';

const ENTRIES_DIR = 'topix_entries';

function topicsPath() {
  return (documentDirectory ?? '') + 'topix_topics.json';
}

function entriesPath(topicId: string) {
  return (documentDirectory ?? '') + ENTRIES_DIR + '/' + topicId + '.json';
}

export async function loadTopics(): Promise<Topic[]> {
  try {
    const json = await readAsStringAsync(topicsPath());
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function saveTopics(topics: Topic[]): Promise<void> {
  await writeAsStringAsync(topicsPath(), JSON.stringify(topics));
}

export async function addTopic(topic: Topic): Promise<void> {
  const topics = await loadTopics();
  topics.push(topic);
  await saveTopics(topics);
}

export async function updateTopicColor(topicId: string, color: string): Promise<void> {
  const topics = await loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    topics[idx] = { ...topics[idx], color };
    await saveTopics(topics);
  }
}

export async function loadEntries(topicId: string): Promise<Entry[]> {
  try {
    const json = await readAsStringAsync(entriesPath(topicId));
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function ensureEntriesDir() {
  try {
    await makeDirectoryAsync((documentDirectory ?? '') + ENTRIES_DIR, {
      intermediates: true,
    });
  } catch {
    // directory already exists
  }
}

export async function addEntry(entry: Entry): Promise<void> {
  await ensureEntriesDir();
  const entries = await loadEntries(entry.topicId);
  entries.unshift(entry);
  await writeAsStringAsync(entriesPath(entry.topicId), JSON.stringify(entries));
}

export async function updateEntry(entry: Entry): Promise<void> {
  const entries = await loadEntries(entry.topicId);
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx !== -1) {
    entries[idx] = entry;
    await writeAsStringAsync(entriesPath(entry.topicId), JSON.stringify(entries));
  }
}

export async function deleteEntry(topicId: string, entryId: string): Promise<void> {
  const entries = await loadEntries(topicId);
  const filtered = entries.filter((e) => e.id !== entryId);
  await writeAsStringAsync(entriesPath(topicId), JSON.stringify(filtered));
}
