// ============================================================
//  utils/prevnamesDB.js — Gestion des prevnames séparée
//  Stockage dans prevnames.json au lieu de quickdb.json
//  
//  Permet :
//    - Stockage léger séparé des configs
//    - Accès rapide
//    - Backup facile
//    - Utilisé par bot principal ET bots privés
// ============================================================

'use strict'

const fs   = require('fs')
const path = require('path')

const DB_PATH = path.join(process.cwd(), 'prevnames.json')

// ── Cache en mémoire ──────────────────────────────────────────
let cache = null

// ── Chargement ────────────────────────────────────────────────
function load() {
  if (cache !== null) return cache
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    cache = JSON.parse(raw)
  } catch {
    cache = {}
  }
  return cache
}

// ── Sauvegarde ────────────────────────────────────────────────
function save(data) {
  cache = data
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.error('[PREVNAMES] Erreur sauvegarde:', err.message)
  }
}

// ── Ajouter un prevname ───────────────────────────────────────
/**
 * @param {string} guildId - ID du serveur (ou userId du bot privé)
 * @param {string} userId - ID de l'utilisateur
 * @param {string} name - Ancien pseudo/username
 * @param {string} type - 'username' | 'nickname'
 */
function addPrevName(guildId, userId, name, type = 'username') {
  const data = load()
  
  // Structure : { guildId: { userId: [...] } }
  if (!data[guildId]) data[guildId] = {}
  if (!data[guildId][userId]) data[guildId][userId] = []
  
  const list = data[guildId][userId]
  
  // Ne pas dupliquer le dernier nom
  if (list.length > 0 && list[list.length - 1].name === name) return
  
  list.push({
    name,
    type,
    savedAt: Date.now(),
  })
  
  // Max 50 entrées par utilisateur
  if (list.length > 50) list.splice(0, list.length - 50)
  
  data[guildId][userId] = list
  save(data)
}

// ── Récupérer les prevnames ───────────────────────────────────
/**
 * @param {string} guildId - ID du serveur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Array} Liste des prevnames
 */
function getPrevNames(guildId, userId) {
  const data = load()
  return data[guildId]?.[userId] || []
}

// ── Récupérer tous les prevnames d'un serveur ─────────────────
/**
 * @param {string} guildId - ID du serveur
 * @returns {Object} { userId: [...prevnames] }
 */
function getAllPrevNames(guildId) {
  const data = load()
  return data[guildId] || {}
}

// ── Nettoyer les prevnames d'un serveur ───────────────────────
function clearGuild(guildId) {
  const data = load()
  delete data[guildId]
  save(data)
}

// ── Nettoyer les prevnames d'un utilisateur ───────────────────
function clearUser(guildId, userId) {
  const data = load()
  if (data[guildId]) {
    delete data[guildId][userId]
    save(data)
  }
}

// ── Export ────────────────────────────────────────────────────
module.exports = {
  addPrevName,
  getPrevNames,
  getAllPrevNames,
  clearGuild,
  clearUser,
}
