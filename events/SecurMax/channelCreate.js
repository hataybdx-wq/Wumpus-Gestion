// ── Anti-Channel Create (SecurMax) ──
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, channel) => {
  const guild = channel.guild
  if (!guild) return
  if (db.get(`channels_${guild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.ChannelCreate })
    const entry = audit.entries.find(e =>
      e.target?.id === channel.id &&
      Date.now() - e.createdTimestamp < 10000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(guild, entry.executor.id, 'channel')) return
    executor = entry.executor
  } catch { return }

  channel.delete('Anti-Channel — suppression automatique').catch(() => false)

  const member = await guild.members.fetch(executor.id).catch(() => null)
  await applySanction(member, guild, 'channel', 'Anti-Channel : création de salon non autorisée')
}
