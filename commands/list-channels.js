const { EmbedBuilder, ChannelType } = require('discord.js')
module.exports = {
  name: 'channels',
  description: 'Liste des salons du serveur',
  aliases: ['list-channels', 'salons'],
  run: async (client, message) => {
    const text = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText)
    const voice = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice)
    const cat = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Salons · ${message.guild.name}`)
      .setColor(0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: `Textuels · ${text.size}`,  value: text.map(c => `<#${c.id}>`).slice(0, 20).join('\n') || '_Aucun_', inline: true },
        { name: `Vocaux · ${voice.size}`,    value: voice.map(c => c.name).slice(0, 20).join('\n') || '_Aucun_',    inline: true },
        { name: `Catégories · ${cat.size}`,  value: cat.map(c => c.name).slice(0, 20).join('\n') || '_Aucune_',     inline: true },
      )
      .setFooter({ text: `Total : ${message.guild.channels.cache.size} salons | Made by Wumpus` })
    ] })
  },
}
