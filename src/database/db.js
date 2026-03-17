const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../sheriff.db'));

// Verilənlər bazası cədvəllərini yaradırıq
db.exec(`
  CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discord_id TEXT,
    thread_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id INTEGER,
    sheriff_name TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(citizen_id) REFERENCES citizens(id)
  );

  CREATE TABLE IF NOT EXISTS duty_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    start_time DATETIME,
    end_time DATETIME,
    duration_minutes INTEGER
  );

  CREATE TABLE IF NOT EXISTS loa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    reason TEXT,
    status TEXT DEFAULT 'ACTIVE'
  );

  CREATE TABLE IF NOT EXISTS fto_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadet_id TEXT,
    fto_id TEXT,
    driving INTEGER,
    shooting INTEGER,
    communication INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS warehouse_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item TEXT,
    action TEXT, -- 'TAKE' or 'RETURN'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
