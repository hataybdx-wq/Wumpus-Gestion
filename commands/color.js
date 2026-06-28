const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'color',
  description: 'Afficher une couleur hexadécimale',
  aliases: ['colour', 'couleur'],
  run: async (client, message, args) => {
    let hex = args[0]?.replace('#', '')
    if (!hex) return message.reply(`Usage : \`!color <#hex>\` (ex: \`!color #FF0000\`)`)
    const n = parseInt(hex, 16)
    if (isNaN(n)) return message.reply('Hex invalide.')

    const r = (n >> 16) & 0xFF, g = (n >> 8) & 0xFF, b = n & 0xFF
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Couleur · #${hex.toUpperCase()}`)
      .setColor(n)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'HEX', value: `#${hex.toUpperCase()}`,       inline: true },
        { name: 'RGB', value: `rgb(${r}, ${g}, ${b})`,       inline: true },
        { name: 'DEC', value: `${n}`,                         inline: true },
      )
      .setImage(`https://singlecolorimage.com/get/${hex}/400x200.png`)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
