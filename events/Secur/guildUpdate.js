// ── Anti-Guild-Update (Secur) ──
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, oldGuild, newGuild) => {
  if (db.get(`antiguildupdate_${oldGuild.id}`) !== true) return

  await new Promise(r => setTimeout(r, 150))

  let executor
  try {
    const audit = await oldGuild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.GuildUpdate })
    const entry = audit.entries.find(e =>
      e.target?.id === oldGuild.id &&
      Date.now() - e.createdTimestamp < 10000
    )
    if (!entry?.executor) return
    if (entry.executor.id === client.user.id) return
    if (isExempt(oldGuild, entry.executor.id, 'guildupdate')) return
    executor = entry.executor
  } catch { return }

  // Restaurer les propriétés modifiées
  const edits = {}
  if (oldGuild.name !== newGuild.name) edits.name = oldGuild.name
  if (oldGuild.iconURL()   !== newGuild.iconURL())   edits.icon   = oldGuild.iconURL({ forceStatic: true, size: 4096 })
  if (oldGuild.bannerURL() !== newGuild.bannerURL()) edits.banner = oldGuild.bannerURL({ forceStatic: true, size: 4096 })
  if (oldGuild.verificationLevel !== newGuild.verificationLevel) edits.verificationLevel = oldGuild.verificationLevel
  if (oldGuild.afkChannel?.id !== newGuild.afkChannel?.id) edits.afkChannel = oldGuild.afkChannelId
  if (Object.keys(edits).length > 0) {
    newGuild.edit({ ...edits, reason: 'Anti-Guild-Update — restauration' }).catch(() => false)
  }

  const member = await newGuild.members.fetch(executor.id).catch(() => null)
  await applySanction(member, newGuild, 'guildupdate', 'Anti-Guild-Update : modification du serveur non autorisée')
}
