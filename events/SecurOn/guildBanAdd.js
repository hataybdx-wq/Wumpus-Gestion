// ── Anti-Mass-Ban (SecurOn) — seuil configurable ────────────────
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const { getSeuil } = require('../../commands/set-sanction')
const db = require('quick.db')

const banCounters = new Map()

module.exports = async (client, ban) => {
  const guild = ban.guild
  if (!guild) return
  if (db.get(`massbans_${guild.id}`) !== true) return

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
    if (isExempt(guild, entry.executor.id, 'massban')) return
    executor = entry.executor
  } catch { return }

  const seuil = getSeuil(guild.id, 'massban')  // 1 en secur-max, 2 par défaut
  const key   = `${guild.id}_${executor.id}`
  const count = (banCounters.get(key) ?? 0) + 1
  banCounters.set(key, count)
  setTimeout(() => banCounters.delete(key), 10000)

  if (count >= seuil) {
    const member = await guild.members.fetch(executor.id).catch(() => null)
    await applySanction(member, guild, 'massban',
      `Anti-Mass-Ban : ${count} ban(s) en 10s (seuil: ${seuil})`)
  }
}
