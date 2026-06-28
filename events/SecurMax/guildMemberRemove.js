// ── Anti-Kick (SecurMax) — détection rapide ──────────────────────
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, member) => {
  const guild = member.guild
  if (!guild) return
  if (db.get(`kick_${guild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.MemberKick })
    const entry = audit.entries.find(e =>
      e.target?.id === member.id &&
      Date.now() - e.createdTimestamp < 8000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(guild, entry.executor.id, 'kick')) return
    executor = entry.executor
  } catch { return }

  const m = await guild.members.fetch(executor.id).catch(() => null)
  await applySanction(m, guild, 'kick', 'Anti-Kick : expulsion non autorisée', member.id)
}
