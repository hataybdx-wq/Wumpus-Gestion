// ============================================================
//  utils/sanction.js — Exécuteur de sanctions centralisé
//
//  Niveaux d'exemption selon le mode :
//    NORMAL   : server owner, bot owner, WL, admins Discord
//    STRICT   : server owner, bot owner, WL seulement
//    SECUR MAX: server owner, bot owner seulement
//
//  Sanctions disponibles :
//    warn · mute · kick · ban · tempban · strip_roles
//
//  SECUR MAX default → strip_roles (retire tous les rôles)
// ============================================================

'use strict'

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('./logs')
const db = require('quick.db')

const DEFAULT_SANCTION  = 'kick'
const DEFAULT_TEMPBAN_D = 24 * 60 * 60 * 1000

function getSanction(guildId, action) {
  const type     = db.get(`sanctions.${guildId}.${action}`)
               ?? db.get(`sanctions.${guildId}.default`)
               ?? DEFAULT_SANCTION
  const duration = db.get(`sanctions.${guildId}.${action}_duration`) ?? DEFAULT_TEMPBAN_D
  return { type, duration }
}

async function applySanction(member, guild, action, reason, victimId = null) {
  if (!member) return
  if (member.user?.bot) return
  if (member.id === guild.members.me?.id) return

  const botOwnerId   = process.env.OWNER_ID || 'public'
  const isGuildOwner = member.id === guild.ownerId
  const isBotOwner   = member.id === botOwnerId || member.id === process.env.OWNER_ID
  if (isBotOwner || isGuildOwner) return

  const { type, duration } = getSanction(guild.id, action)

  try {
    switch (type) {

      case 'warn':
        await member.user.send(
          `**⚠️ Avertissement — ${guild.name}**\n` +
          `Action non autorisée : **${action}**\nRaison : ${reason}`
        ).catch(() => false)
        break

      case 'mute':
        await member.timeout(60 * 60 * 1000, reason).catch(() => false)
        break

      case 'kick':
        await member.kick(reason).catch(() => false)
        break

      case 'ban':
        await member.ban({ reason }).catch(() => false)
        break

      case 'tempban':
        await member.ban({ reason: `[TEMPBAN] ${reason}` }).catch(() => false)
        setTimeout(async () => {
          await guild.bans.remove(member.id, 'Fin du tempban automatique').catch(() => false)
        }, duration)
        break

      // ── STRIP ROLES : retire tous les rôles assignables ──
      case 'strip_roles': {
        const botHighest = guild.members.me?.roles.highest
        const rolesToRemove = member.roles.cache.filter(r =>
          r.id !== guild.id &&
          !r.managed &&
          (botHighest ? botHighest.comparePositionTo(r) > 0 : true)
        )
        for (const [, role] of rolesToRemove) {
          await member.roles.remove(role, reason).catch(() => false)
        }
        await member.user.send(
          `**🔒 Sanction — ${guild.name}**\n` +
          `Tous vos rôles ont été retirés suite à une action non autorisée.\n` +
          `**Action :** \`${action}\`\n**Raison :** ${reason}\n\n` +
          `Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.`
        ).catch(() => false)
        break
      }

      default:
        await member.kick(reason).catch(() => false)
    }
  } catch (err) {
    console.error(`[SANCTION] Erreur sur ${member.id}:`, err.message)
  }

  const durationStr = type === 'tempban' ? ` (${Math.round(duration / 3600000)}h)` : ''
  sendLog(guild, 'secur',
    `Sanction — ${type.toUpperCase()}${durationStr}`,
    `**Action :** \`${action}\`\n**Sanctionné :** <@${member.id}>\n` +
    (victimId ? `**Victime :** <@${victimId}>\n` : '') +
    `**Raison :** ${reason}\n**Sanction :** \`${type}\`${durationStr}`,
    type === 'ban' || type === 'tempban' ? 0xFF0000 : 0xFF8800
  )
}

/**
 * Vérifie si un userId est exempt de sanction pour une action.
 *
 * MODE SECUR MAX (db `secur_${gid}` = true) :
 *   → Exempt UNIQUEMENT : server owner + bot owner
 *
 * MODE STRICT (wl_strict.{gid}.{action} = true) :
 *   → Exempt : server owner + bot owner + WL
 *
 * MODE NORMAL :
 *   → Exempt : server owner + bot owner + WL + admins Discord
 */
function isExempt(guild, userId, action = null) {
  if (userId === guild.members.me?.id) return true
  if (userId === guild.ownerId)        return true

  const botOwnerId = process.env.OWNER_ID || 'public'
  if (userId === botOwnerId)           return true
  if (userId === process.env.OWNER_ID) return true

  const securMax = db.get(`secur_${guild.id}`) === true
  if (securMax) return false

  const isWL    = db.get(`wl.${botOwnerId}.${userId}`) !== null
  const strict  = action && db.get(`wl_strict.${guild.id}.${action}`) === true

  if (strict) return isWL

  if (isWL) return true
  const member = guild.members.cache.get(userId)
  if (member?.permissions.has(PermissionFlagsBits.Administrator)) return true

  return false
}

module.exports = { applySanction, getSanction, isExempt }
