const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'emojiinfo',
  description: 'Informations sur un emoji du serveur',
  aliases: ['emoji-info', 'ei'],
  run: async (client, message, args) => {
    const arg = args[0]
    if (!arg) return message.reply(`Usage : \`!emojiinfo <emoji>\``)

    const match = arg.match(/<(a?):\w+:(\d+)>/)
    const id = match ? match[2] : arg
    const emoji = message.guild.emojis.cache.get(id)
    if (!emoji) return message.reply('Emoji non trouvé sur ce serveur.')

    const created = Math.floor(emoji.createdTimestamp / 1000)
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Emoji · :${emoji.name}:`)
      .setColor(0xFF0000)
      .setThumbnail(emoji.url)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Nom',      value: emoji.name,                     inline: true },
        { name: 'ID',       value: `\`${emoji.id}\``,              inline: true },
        { name: 'Animé',    value: emoji.animated ? 'Oui' : 'Non', inline: true },
        { name: 'Créé',     value: `<t:${created}:R>`,             inline: true },
        { name: 'URL',      value: emoji.url,                      inline: false },
      )
    ] })
  },
}
