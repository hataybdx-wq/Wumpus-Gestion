// ── Anti-Ban (SecurMax) — détection rapide ──────────────────────
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, ban) => {
  const guild = ban.guild
  if (!guild) return
  if (db.get(`bans_${guild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.MemberBanAdd })
    const entry = audit.entries.find(e =>
      e.target?.id === ban.user.id &&
      Date.now() - e.createdTimestamp < 8000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(guild, entry.executor.id, 'ban')) return
    executor = entry.executor
  } catch { return }

  // Déban immédiat de la victime
  guild.bans.remove(ban.user.id, 'Anti-Ban — restauration automatique').catch(() => false)

  const member = await guild.members.fetch(executor.id).catch(() => null)
  await applySanction(member, guild, 'ban', 'Anti-Ban : bannissement non autorisé', ban.user.id)
}
