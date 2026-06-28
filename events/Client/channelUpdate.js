// ============================================================
//  Événement : channelUpdate (Client) — Log modification salon
// ============================================================

const { sendLog } = require('../../utils/logs')
const { AuditLogEvent } = require('discord.js')

module.exports = async (client, oldChannel, newChannel) => {
  if (!newChannel.guild) return
  const changes = []
  if (oldChannel.name  !== newChannel.name)  changes.push(`**Nom :** \`${oldChannel.name}\` → \`${newChannel.name}\``)
  if (oldChannel.topic !== newChannel.topic) changes.push(`**Sujet :** ${oldChannel.topic ?? '*vide*'} → ${newChannel.topic ?? '*vide*'}`)
  if (oldChannel.nsfw  !== newChannel.nsfw)  changes.push(`**NSFW :** ${oldChannel.nsfw} → ${newChannel.nsfw}`)
  if (changes.length === 0) return

  let modifier = 'Inconnu'
  try {
    const audit = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate })
    const entry = audit.entries.first()
    if (entry && Date.now() - entry.createdTimestamp < 5000) modifier = `<@${entry.executor.id}>`
  } catch {}

  sendLog(
    newChannel.guild, 'channels',
    'Salon modifié',
    `**Salon :** <#${newChannel.id}>\n**Modifié par :** ${modifier}\n${changes.join('\n')}`,
    0xFFAA00
  )
}
