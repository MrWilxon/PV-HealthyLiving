import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'data.json');

// ── Types ──────────────────────────────────────────────────────────

export type DocValue = string | number | boolean | null | undefined | number[] | Record<string, unknown> | unknown[];

export interface DocData {
  [key: string]: DocValue;
}

export interface DocSnapshot {
  id: string;
  exists: boolean;
  data(): DocData | undefined;
  ref: DocumentRef;
}

export interface QuerySnapshot {
  docs: DocSnapshot[];
  size: number;
  empty: boolean;
  forEach(cb: (doc: DocSnapshot) => void): void;
}

export interface DocumentRef {
  id: string;
  get(): Promise<DocSnapshot>;
  set(data: DocData): Promise<void>;
  update(data: Partial<DocData>): Promise<void>;
  delete(): Promise<void>;
}

export interface Query {
  get(): Promise<QuerySnapshot>;
  where(field: string, op: string, value: DocValue): Query;
  orderBy(field: string, direction?: 'asc' | 'desc'): OrderedQuery;
  limit(n: number): OrderedQuery;
}

export interface OrderedQuery {
  get(): Promise<QuerySnapshot>;
  limit?(n: number): OrderedQuery;
}

export interface BatchOps {
  update(ref: DocumentRef, data: Partial<DocData>): void;
  set(ref: DocumentRef, data: DocData): void;
  delete(ref: DocumentRef): void;
  commit(): Promise<void>;
}

// ── Collection ─────────────────────────────────────────────────────

class Collection {
  private docs: Map<string, DocData> = new Map();

  constructor(private name: string) {
    this.load();
  }

  private load() {
    try {
      const all: Record<string, Record<string, DocData>> = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      const items = all[this.name] || {};
      for (const [id, data] of Object.entries(items)) {
        this.docs.set(id, data);
      }
    } catch {
      // no data yet
    }
  }

  save() {
    let all: Record<string, Record<string, DocData>> = {};
    try {
      all = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      all = {};
    }
    const obj: Record<string, DocData> = {};
    for (const [id, data] of this.docs) {
      obj[id] = data;
    }
    all[this.name] = obj;
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(all, null, 2));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  doc(id?: string): DocumentRef {
    const docId = id || this.generateId();
    const self = this;
    return {
      id: docId,
      get: async () => {
        const data = self.docs.get(docId);
        return {
          id: docId,
          exists: !!data,
          data: () => (data ? { ...data } : undefined),
          ref: self.doc(docId),
        };
      },
      set: async (data: DocData) => {
        self.docs.set(docId, data);
        self.save();
      },
      update: async (updateData: Partial<DocData>) => {
        const existing = self.docs.get(docId) || {};
        Object.assign(existing, updateData);
        self.docs.set(docId, existing);
        self.save();
      },
      delete: async () => {
        self.docs.delete(docId);
        self.save();
      },
    };
  }

  async add(data: DocData): Promise<DocumentRef> {
    const id = this.generateId();
    this.docs.set(id, { ...data });
    this.save();
    return this.doc(id);
  }

  async get(): Promise<QuerySnapshot> {
    const docsList: DocSnapshot[] = [];
    for (const [id, data] of this.docs) {
      docsList.push({
        id,
        exists: true,
        data: () => ({ ...data }),
        ref: this.doc(id),
      });
    }
    return {
      docs: docsList,
      size: docsList.length,
      empty: docsList.length === 0,
      forEach: (cb) => docsList.forEach(cb),
    };
  }

  where(field: string, op: string, value: DocValue): Query {
    const self = this;
    return {
      get: async () => {
        const all = await self.get();
        const filtered = all.docs.filter((doc) => {
          const d = doc.data() || {};
          const fieldVal = d[field];
          switch (op) {
            case '==': return fieldVal === value;
            case '!=': return fieldVal !== value;
            case '>': return (fieldVal as number) > (value as number);
            case '<': return (fieldVal as number) < (value as number);
            case '>=': return (fieldVal as number) >= (value as number);
            case '<=': return (fieldVal as number) <= (value as number);
            default: return false;
          }
        });
        return {
          docs: filtered,
          size: filtered.length,
          empty: filtered.length === 0,
          forEach: (cb) => filtered.forEach(cb),
        };
      },
      where: (f, o, v) => self.where(f, o, v),
      orderBy: (field, direction = 'asc') => self.orderBy(field, direction),
      limit: (n) => ({
        get: async () => {
          const q = await self.where(field, op, value).get();
          const limited = q.docs.slice(0, n);
          return { docs: limited, size: limited.length, empty: limited.length === 0, forEach: (cb: (doc: DocSnapshot) => void) => limited.forEach(cb) };
        },
        limit: (m: number) => ({
          get: async () => {
            const q = await self.where(field, op, value).get();
            const limited = q.docs.slice(0, Math.min(n, m));
            return { docs: limited, size: limited.length, empty: limited.length === 0, forEach: (cb: (doc: DocSnapshot) => void) => limited.forEach(cb) };
          },
        }),
      }),
    };
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): OrderedQuery {
    const self = this;
    const sort = async (): Promise<QuerySnapshot> => {
      const all = await self.get();
      all.docs.sort((a, b) => {
        const d1 = a.data() || {};
        const d2 = b.data() || {};
        const aVal = d1[field] as string | number | undefined;
        const bVal = d2[field] as string | number | undefined;
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -cmp : cmp;
      });
      return {
        docs: all.docs,
        size: all.docs.length,
        empty: all.docs.length === 0,
        forEach: (cb) => all.docs.forEach(cb),
      };
    };
    return {
      get: sort,
      limit: (n) => ({
        get: async () => {
          const result = await sort();
          const limited = result.docs.slice(0, n);
          return {
            docs: limited,
            size: limited.length,
            empty: limited.length === 0,
            forEach: (cb) => limited.forEach(cb),
          };
        },
        limit: (m) => ({
          get: async () => {
            const result = await sort();
            const limited = result.docs.slice(0, Math.min(n, m));
            return {
              docs: limited,
              size: limited.length,
              empty: limited.length === 0,
              forEach: (cb) => limited.forEach(cb),
            };
          },
        }),
      }),
    };
  }
}

// ── Firestore-like wrapper ─────────────────────────────────────────

class Firestore {
  private collections: Map<string, Collection> = new Map();

  collection(name: string): Collection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection(name));
    }
    return this.collections.get(name)!;
  }

  batch(): BatchOps & { commit(): Promise<void> } {
    const ops: Array<() => Promise<void>> = [];
    return {
      update: (ref, data) => { ops.push(async () => ref.update(data)); },
      set: (ref, data) => { ops.push(async () => ref.set(data)); },
      delete: (ref) => { ops.push(async () => ref.delete()); },
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  }
}

const db = new Firestore();

export { db };
