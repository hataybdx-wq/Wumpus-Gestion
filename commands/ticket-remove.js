// ============================================================
//  Commande : ticket-remove
//  Retire un membre du ticket actuel.
//  Usage : !ticket-remove @membre
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ticket-remove',
  description: 'Retire un membre du ticket actuel',
  aliases: ['tremove'],
  run: async (client, message, args, prefix) => {
    const ticketData = db.get(`ticket_channel_${message.channel.id}`)
    if (!ticketData) return message.reply('Ce salon n\'est pas un ticket.')

    const cfg     = db.get(`tickets_${message.guild.id}`) || {}
    const isStaff = cfg.staffRoleId
      ? message.member.roles.cache.has(cfg.staffRoleId)
      : message.member.permissions.has(PermissionFlagsBits.ManageChannels)

    if (!isStaff) return message.reply('Réservé au staff.')

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!target) return message.reply(`Usage : \`${prefix}ticket-remove @membre\``)

    if (target.id === ticketData.ownerId) {
      return message.reply('Vous ne pouvez pas retirer le créateur du ticket.')
    }

    await message.channel.permissionOverwrites.edit(target.id, {
      ViewChannel: false,
    })

    message.reply(`**${target.user.username}** a été retiré du ticket.`)
  },
}
