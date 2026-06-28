// ============================================================
//  Commande : ticket-close  (alias: tclose, fermer)
//  Ferme le ticket actuel et génère un transcript HTML.
//  Usage : !ticket-close [raison]
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')
const { closeTicket } = require('../utils/ticketUtils')

module.exports = {
  name: 'ticket-close',
  description: 'Ferme le ticket actuel',
  aliases: ['tclose', 'fermer'],

  run: async (client, message, args, prefix) => {
    const gid        = message.guild.id
    const ticketData = db.get(`ticket_channel_${message.channel.id}`)
    if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')

    const cfg     = db.get(`tickets_${gid}`) || {}
    const isOwner = ticketData.ownerId === message.author.id
    const isStaff = cfg.staffRoleId
      ? message.member.roles.cache.has(cfg.staffRoleId)
      : message.member.permissions.has(PermissionFlagsBits.ManageChannels)

    if (!isOwner && !isStaff) {
      return message.reply('❌ Seul le créateur du ticket ou un membre du staff peut fermer ce ticket.')
    }

    const reason = args.join(' ') || 'Aucune raison précisée'
    await closeTicket(client, message.guild, message.channel, ticketData, cfg, message.member, reason)
  },
}
