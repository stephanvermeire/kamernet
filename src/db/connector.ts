import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('mijnDatabase');

const initDatabase = `
CREATE TABLE IF NOT EXISTS kamer (
    id TEXT PRIMARY KEY
);`;

db.exec(initDatabase);


export function getKamer(id: string){
  return db.prepare('SELECT * FROM kamer WHERE id = ?').get(id);
}

export function setKamer(id: string){
  return db.prepare(`INSERT INTO kamer (id) VALUES (?)`).run(id);
}
