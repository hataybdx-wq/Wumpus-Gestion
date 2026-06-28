// utils/jsondb.js — Stockage JSON simple par fichier
'use strict'
const fs   = require('fs')
const path = require('path')
const DATA_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const caches = new Map()

function load(name) {
  if (caches.has(name)) return caches.get(name)
  const file = path.join(DATA_DIR, `${name}.json`)
  let data = {}
  if (fs.existsSync(file)) {
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { data = {} }
  }
  const entry = { data, file, saveTimer: null }
  caches.set(name, entry)
  return entry
}

function save(entry) {
  if (entry.saveTimer) return
  entry.saveTimer = setTimeout(() => {
    entry.saveTimer = null
    try {
      const tmp = `${entry.file}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(entry.data, null, 2), 'utf8')
      fs.renameSync(tmp, entry.file)
    } catch (err) { console.error('[JSONDB]', err.message) }
  }, 500)
}

function jsondb(name) {
  const entry = load(name)
  return {
    get:    (key)        => entry.data[key] ?? null,
    set:    (key, value) => { entry.data[key] = value; save(entry) },
    delete: (key)        => { delete entry.data[key]; save(entry) },
    all:    ()           => ({ ...entry.data }),
    has:    (key)        => Object.prototype.hasOwnProperty.call(entry.data, key),
  }
}

module.exports = jsondb
