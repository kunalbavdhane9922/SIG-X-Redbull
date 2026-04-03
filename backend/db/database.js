/**
 * Database Layer — SQLite In-Memory (equivalent to H2 in the Java backend)
 * 
 * Creates the same schema as the JPA entities:
 *   - users (id, username, password)
 *   - rooms (room_id, created_by)
 *   - participants (id, team_id, room_id)
 * 
 * Seeds initial data: admin/admin123 (same as data.sql)
 */

const Database = require('better-sqlite3');

const db = new Database(':memory:');

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ─── Schema (mirrors JPA entities exactly) ───────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    room_id TEXT NOT NULL
  );
`);

// ─── Seed Data (mirrors data.sql) ────────────────────────────────────────────

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)'
);
insertUser.run('admin', 'admin123');

// ─── Repository Methods (mirrors Spring Data JPA interfaces) ─────────────────

const userRepo = {
  findByUsernameAndPassword(username, password) {
    return db.prepare(
      'SELECT * FROM users WHERE username = ? AND password = ?'
    ).get(username, password) || null;
  },
};

const roomRepo = {
  save(roomId, createdBy) {
    db.prepare('INSERT INTO rooms (room_id, created_by) VALUES (?, ?)').run(roomId, createdBy);
  },
};

const participantRepo = {
  existsByTeamIdAndRoomId(teamId, roomId) {
    const row = db.prepare(
      'SELECT 1 FROM participants WHERE team_id = ? AND room_id = ? LIMIT 1'
    ).get(teamId, roomId);
    return !!row;
  },

  save(teamId, roomId) {
    db.prepare('INSERT INTO participants (team_id, room_id) VALUES (?, ?)').run(teamId, roomId);
  },

  findByRoomId(roomId) {
    return db.prepare('SELECT * FROM participants WHERE room_id = ?').all(roomId);
  },
};

module.exports = { db, userRepo, roomRepo, participantRepo };
