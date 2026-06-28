// ============================================================
//  Commande : ticket-add
//  Ajoute un membre au ticket actuel.
//  Usage : !ticket-add @membre
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ticket-add',
  description: 'Ajoute un membre au ticket actuel',
  aliases: ['tadd'],
  run: async (client, message, args, prefix) => {
    const ticketData = db.get(`ticket_channel_${message.channel.id}`)
    if (!ticketData) return message.reply('Ce salon n\'est pas un ticket.')

    const cfg     = db.get(`tickets_${message.guild.id}`) || {}
    const isStaff = cfg.staffRoleId
      ? message.member.roles.cache.has(cfg.staffRoleId)
      : message.member.permissions.has(PermissionFlagsBits.ManageChannels)

    if (!isStaff) return message.reply('Réservé au staff.')

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!target) return message.reply(`Usage : \`${prefix}ticket-add @membre\``)

    await message.channel.permissionOverwrites.edit(target.id, {
      ViewChannel:        true,
      SendMessages:       true,
      ReadMessageHistory: true,
    })

    message.reply(`**${target.user.username}** a été ajouté au ticket.`)
  },
}
