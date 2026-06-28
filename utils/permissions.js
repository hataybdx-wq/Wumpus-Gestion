// ============================================================
//  utils/permissions.js — Système de permissions centralisé
//
//  Niveaux d'accès (du plus bas au plus haut) :
//
//  0 - PUBLIC     : toutes les commandes fun/info (8ball, pp, ping…)
//  1 - WL         : whitelist → commandes publiques + modération de base
//                   (ban, kick, mute, clear, lock, snipe…)
//  2 - STAFF      : permission Discord native (BanMembers, ManageMessages…)
//                   Peut tout faire sauf les commandes admin/secur
//  3 - ADMIN      : Administrateur Discord → tout sauf setup secur/logs
//  4 - BOT_OWNER  : Propriétaire du bot privé (abonné) → tout
//  5 - OWNER : Owner du bot principal (toi) → tout + genkey etc.
//
//  Whitelist stockée par bot :
//    wl.{botOwnerId}.{userId}  → { addedAt, addedBy }
//
//  Pour le bot PUBLIC (pas de botOwnerId), on utilise 'public' comme clé.
// ============================================================

'use strict'

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

// ── Helpers WL ────────────────────────────────────────────────

/**
 * Retourne l'ID du propriétaire du contexte courant.
 * Pour le bot public c'est 'public', pour un bot privé c'est l'userId abonné.
 * Passé en param depuis le routeur de commandes via process.env.OWNER_ID.
 */
function getBotOwnerId() {
  return process.env.OWNER_ID || 'public'
}

/**
 * Vérifie si un userId est dans la whitelist du bot actuel.
 */
function isWhitelisted(userId) {
  const key = `wl.${getBotOwnerId()}.${userId}`
  return db.get(key) !== null
}

/**
 * Ajoute un userId à la whitelist du bot actuel.
 */
function addToWL(userId, addedBy) {
  db.set(`wl.${getBotOwnerId()}.${userId}`, { addedAt: Date.now(), addedBy })
}

/**
 * Retire un userId de la whitelist du bot actuel.
 */
function removeFromWL(userId) {
  db.set(`wl.${getBotOwnerId()}.${userId}`, null)
}

/**
 * Retourne tous les IDs whitelist du bot actuel.
 */
function getWLList() {
  const prefix = `wl.${getBotOwnerId()}.`
  const all    = db.all ? db.all() : {}
  return Object.entries(all)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => ({ userId: k.replace(prefix, ''), ...v }))
}

// ── Vérificateurs de niveau ───────────────────────────────────

/**
 * Vérifie que l'auteur peut utiliser une commande de niveau donné.
 *
 * @param {Message}  message   - message Discord
 * @param {string}   level     - 'public'|'wl'|'staff'|'admin'|'bot_owner'|'owner'
 * @param {string}   [staffPerm] - Permission Discord requise pour le niveau 'staff'
 * @returns {boolean}
 */
function can(message, level, staffPerm = null) {
  const userId  = message.author.id
  const member  = message.member
  const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator)

  // OWNER : owner du bot principal
  if (level === 'owner') return userId === process.env.OWNER_ID

  // BOT_OWNER : propriétaire de ce bot privé (ou owner)
  if (level === 'bot_owner') {
    return userId === getBotOwnerId() || userId === process.env.OWNER_ID
  }

  // ADMIN : admin Discord + bot_owner + owner
  if (level === 'admin') {
    return isAdmin || userId === getBotOwnerId() || userId === process.env.OWNER_ID
  }

  // STAFF : permission Discord native OU WL OU admin OU bot_owner
  if (level === 'staff') {
    if (!staffPerm) return isAdmin || isWhitelisted(userId) || userId === getBotOwnerId()
    return member?.permissions.has(staffPerm) || isWhitelisted(userId) || isAdmin || userId === getBotOwnerId()
  }

  // WL : whitelisté OU admin OU bot_owner
  if (level === 'wl') {
    return isWhitelisted(userId) || isAdmin || userId === getBotOwnerId() || userId === process.env.OWNER_ID
  }

  // PUBLIC : tout le monde (sauf bots)
  if (level === 'public') return !message.author.bot

  return false
}

module.exports = { can, isWhitelisted, addToWL, removeFromWL, getWLList, getBotOwnerId }
