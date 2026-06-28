// ── Anti-Mass-Kick (SecurOn) — seuil configurable ───────────────
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const { getSeuil } = require('../../commands/set-sanction')
const db = require('quick.db')

const kickCounters = new Map()

module.exports = async (client, member) => {
  const guild = member.guild
  if (!guild) return
  if (db.get(`masskick_${guild.id}`) !== true) return

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
    if (isExempt(guild, entry.executor.id, 'masskick')) return
    executor = entry.executor
  } catch { return }

  const seuil = getSeuil(guild.id, 'masskick')  // 1 en secur-max, 2 par défaut
  const key   = `${guild.id}_${executor.id}`
  const count = (kickCounters.get(key) ?? 0) + 1
  kickCounters.set(key, count)
  setTimeout(() => kickCounters.delete(key), 10000)

  if (count >= seuil) {
    const m = await guild.members.fetch(executor.id).catch(() => null)
    await applySanction(m, guild, 'masskick',
      `Anti-Mass-Kick : ${count} kick(s) en 10s (seuil: ${seuil})`)
  }
}
