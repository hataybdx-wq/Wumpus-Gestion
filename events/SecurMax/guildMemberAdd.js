// ── Anti-Bot (SecurMax) — seuil configurable ────────────────────
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const { getSeuil } = require('../../commands/set-sanction')
const db = require('quick.db')

const botCounters = new Map()

module.exports = async (client, member) => {
  const guild = member.guild
  if (!guild) return
  if (!member.user.bot) return
  if (member.id === client.user.id) return
  if (db.get(`bots_${guild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.BotAdd })
    const entry = audit.entries.find(e =>
      e.target?.id === member.id &&
      Date.now() - e.createdTimestamp < 8000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(guild, entry.executor.id, 'bot')) return
    executor = entry.executor
  } catch { return }

  const seuil = getSeuil(guild.id, 'bot')  // 1 en secur-max (et par défaut)
  const key   = `${guild.id}_${executor.id}`
  const count = (botCounters.get(key) ?? 0) + 1
  botCounters.set(key, count)
  setTimeout(() => botCounters.delete(key), 30000)

  if (count >= seuil) {
    // Expulser le bot
    member.kick('Anti-Bot — ajout non autorisé').catch(() => false)

    const m = await guild.members.fetch(executor.id).catch(() => null)
    await applySanction(m, guild, 'bot',
      `Anti-Bot : ${count} bot(s) ajouté(s) (seuil: ${seuil})`, member.id)
  }
}
