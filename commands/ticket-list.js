// ============================================================
//  Commande : ticket-list  (alias: tlist, tickets)
//  Affiche tous les tickets ouverts sur le serveur.
//  Usage : !ticket-list [@membre]
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize, MessageFlags, PermissionFlagsBits,
} = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ticket-list',
  description: 'Liste tous les tickets ouverts',
  aliases: ['tlist', 'tickets'],

  run: async (client, message, args, prefix) => {
    const gid = message.guild.id
    const cfg = db.get(`tickets_${gid}`) || {}

    const isStaff = cfg.staffRoleId
      ? message.member.roles.cache.has(cfg.staffRoleId)
      : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
    if (!isStaff) return message.reply('❌ Réservé au staff.')

    const allTickets = db.get(`tickets_open_${gid}`) || {}
    const entries    = Object.entries(allTickets)
    if (entries.length === 0) return message.reply('Aucun ticket ouvert sur ce serveur.')

    const filterMember = message.mentions.members.first()
      || (args[0] ? message.guild.members.cache.get(args[0]) : null)

    const filtered = filterMember
      ? entries.filter(([, t]) => t.ownerId === filterMember.id)
      : entries

    if (filtered.length === 0)
      return message.reply(`Aucun ticket ouvert pour **${filterMember.user.username}**.`)

    const lines = filtered
      .map(([cid, t]) => {
        const ch = message.guild.channels.cache.get(cid)
        if (!ch) return null
        const num     = `#${String(t.number || 0).padStart(4, '0')}`
        const claimed = t.claimedBy ? ` · ✋ <@${t.claimedBy}>` : ''
        const subject = t.subject ? ` · *${t.subject}*` : ''
        return `${num} <#${cid}> — <@${t.ownerId}>${subject}${claimed}`
      })
      .filter(Boolean)

    const c = new ContainerBuilder().setAccentColor(0xFF0000)
    c.addTextDisplayComponents(td => td.setContent(
      `## 🎫 Tickets ouverts (${lines.length})\n-# ${message.guild.name}`
    ))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(
      lines.join('\n').slice(0, 3900) || 'Aucun salon trouvé.'
    ))

    message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
  },
}
