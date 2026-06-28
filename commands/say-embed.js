const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'sayembed',
  description: 'Envoie un embed simple',
  aliases: ['say-embed'],
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return
    const text = args.join(' ')
    if (!text) return message.reply(`Usage : \`!sayembed <texte>\``)

    message.delete().catch(() => false)
    message.channel.send({ embeds: [new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setDescription(text).setColor(0xFF0000).setFooter({ text: 'Made by Wumpus' })] })
  },
}
