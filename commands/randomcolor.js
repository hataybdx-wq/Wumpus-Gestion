const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'randomcolor',
  description: 'Génère une couleur aléatoire',
  aliases: ['rand-color'],
  run: async (client, message) => {
    const n = Math.floor(Math.random() * 0xFFFFFF)
    const hex = n.toString(16).padStart(6, '0').toUpperCase()
    const r = (n >> 16) & 0xFF, g = (n >> 8) & 0xFF, b = n & 0xFF

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Couleur aléatoire · #${hex}`)
      .setColor(n)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'HEX', value: `#${hex}`,                    inline: true },
        { name: 'RGB', value: `rgb(${r}, ${g}, ${b})`,      inline: true },
      )
      .setImage(`https://singlecolorimage.com/get/${hex}/400x200.png`)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
