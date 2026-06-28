// ── Anti-Channel Update (SecurMax) ──
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, oldChannel, newChannel) => {
  const guild = oldChannel.guild
  if (!guild) return
  if (db.get(`channels_${guild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.ChannelUpdate })
    const entry = audit.entries.find(e =>
      e.target?.id === oldChannel.id &&
      Date.now() - e.createdTimestamp < 10000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(guild, entry.executor.id, 'channel')) return
    executor = entry.executor
  } catch { return }

  // Restaurer les propriétés originales
  newChannel.edit({
    name:             oldChannel.name,
    topic:            oldChannel.topic            ?? null,
    nsfw:             oldChannel.nsfw,
    bitrate:          oldChannel.bitrate          ?? undefined,
    userLimit:        oldChannel.userLimit        ?? undefined,
    rateLimitPerUser: oldChannel.rateLimitPerUser ?? 0,
    reason:           'Anti-Channel — restauration automatique',
  }).catch(() => false)

  const member = await guild.members.fetch(executor.id).catch(() => null)
  await applySanction(member, guild, 'channel', 'Anti-Channel : modification de salon non autorisée')
}
