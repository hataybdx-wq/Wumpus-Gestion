// ============================================================
//  Événement : channelCreate (Client) — Log création salon
//  (log normal, distinct de SecurMax qui bloque la création)
// ============================================================

const { sendLog } = require('../../utils/logs')
const { AuditLogEvent } = require('discord.js')

module.exports = async (client, channel) => {
  if (!channel.guild) return

  let creator = 'Inconnu'
  try {
    const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate })
    const entry = audit.entries.first()
    if (entry && Date.now() - entry.createdTimestamp < 5000) creator = `<@${entry.executor.id}>`
  } catch {}

  sendLog(
    channel.guild, 'channels',
    'Salon créé',
    `**Salon :** <#${channel.id}> (\`${channel.name}\`)\n**Type :** ${channel.type}\n**Créé par :** ${creator}`,
    0x00FF88
  )
}
