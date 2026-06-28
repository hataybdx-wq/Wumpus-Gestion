// ============================================================
//  Événement : channelDelete (Client) — Log suppression salon
// ============================================================

const { sendLog } = require('../../utils/logs')
const { AuditLogEvent } = require('discord.js')

module.exports = async (client, channel) => {
  if (!channel.guild) return

  let deleter = 'Inconnu'
  try {
    const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete })
    const entry = audit.entries.first()
    if (entry && Date.now() - entry.createdTimestamp < 5000) deleter = `<@${entry.executor.id}>`
  } catch {}

  sendLog(
    channel.guild, 'channels',
    'Salon supprimé',
    `**Nom :** \`${channel.name}\`\n**ID :** \`${channel.id}\`\n**Supprimé par :** ${deleter}`,
    0xFF4444
  )
}
