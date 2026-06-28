// ── Anti-Invite Create (SecurMax) ──
const { AuditLogEvent } = require('discord.js')
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, invite) => {
  const guild = invite.guild
  if (!guild) return
  if (db.get(`anticreainvite_${guild.id}`) !== true) return
  if (!invite.inviterId) return
  if (invite.inviterId === client.user.id) return
  if (isExempt(guild, invite.inviterId, 'invite')) return

  // On a directement l'ID de l'inviteur sans avoir besoin de l'audit log
  invite.delete('Anti-Invite — création non autorisée').catch(() => false)

  const member = await guild.members.fetch(invite.inviterId).catch(() => null)
  await applySanction(member, guild, 'invite', 'Anti-Invite : création d\'invitation non autorisée')
}
