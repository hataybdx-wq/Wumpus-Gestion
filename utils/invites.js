// ============================================================
//  utils/invites.js — Tracking d'invitations
//
//  Stockage :
//    data/invites.json
//      `cache_${guildId}`     → { code: uses, ... }      (cache des usages à la connexion)
//      `config_${guildId}`    → { joinLogs, leaveLogs, dmOnMilestone, milestoneRoles: [...] }
//      `inv_${guildId}_${uid}` → { real, bonus, fake, left, invitedBy: [...] }
// ============================================================

'use strict'

const jsondb = require('./jsondb')
const invdb  = jsondb('invites')

// ── Cache d'usages (code → nbUses) par serveur ────────────────
function getCache(gid) {
  return invdb.get(`cache_${gid}`) || {}
}
function setCache(gid, cache) {
  invdb.set(`cache_${gid}`, cache)
}

// ── Config par serveur ────────────────────────────────────────
function getConfig(gid) {
  return invdb.get(`config_${gid}`) || {
    logsChannelId: null,     // salon où envoyer join/leave
    active:        false,
    dmMessage:     null,     // DM à envoyer quand un membre atteint un palier
    milestoneRoles:[],       // [{ count: 5, roleId: '...' }]
  }
}
function setConfig(gid, cfg) {
  invdb.set(`config_${gid}`, cfg)
}

// ── Statistiques par utilisateur ──────────────────────────────
function getStats(gid, uid) {
  return invdb.get(`inv_${gid}_${uid}`) || { real: 0, bonus: 0, fake: 0, left: 0, invited: [] }
}
function setStats(gid, uid, stats) {
  invdb.set(`inv_${gid}_${uid}`, stats)
}

function addInvite(gid, inviterId, joinedUserId) {
  const s = getStats(gid, inviterId)
  s.real = (s.real || 0) + 1
  if (!Array.isArray(s.invited)) s.invited = []
  s.invited.push({ userId: joinedUserId, joinedAt: Date.now(), left: false })
  setStats(gid, inviterId, s)
  return s
}

function markLeft(gid, joinedUserId) {
  // Chercher parmi tous les inviters qui a invité cet user
  const all = invdb.all()
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith(`inv_${gid}_`)) continue
    if (!Array.isArray(v.invited)) continue
    const entry = v.invited.find(e => e.userId === joinedUserId && !e.left)
    if (entry) {
      entry.left = true
      v.left = (v.left || 0) + 1
      v.real = Math.max(0, (v.real || 1) - 1)
      invdb.set(k, v)
      return { inviterId: k.replace(`inv_${gid}_`, ''), stats: v }
    }
  }
  return null
}

function getTotal(gid, uid) {
  const s = getStats(gid, uid)
  return (s.real || 0) + (s.bonus || 0) - (s.fake || 0)
}

function topInviters(gid, limit = 10) {
  const all = invdb.all()
  const prefix = `inv_${gid}_`
  return Object.entries(all)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => ({
      userId: k.replace(prefix, ''),
      real:   v.real  || 0,
      bonus:  v.bonus || 0,
      fake:   v.fake  || 0,
      left:   v.left  || 0,
      total:  (v.real || 0) + (v.bonus || 0) - (v.fake || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

// ── Initialisation : cacher les usages au démarrage ───────────
async function initGuild(guild) {
  try {
    const invites = await guild.invites.fetch()
    const cache   = {}
    invites.forEach(inv => { cache[inv.code] = inv.uses || 0 })
    setCache(guild.id, cache)
  } catch (err) {
    console.error(`[INVITES] Erreur init ${guild.id}:`, err.message)
  }
}

module.exports = {
  getCache, setCache,
  getConfig, setConfig,
  getStats, setStats,
  addInvite, markLeft, getTotal, topInviters,
  initGuild,
}
