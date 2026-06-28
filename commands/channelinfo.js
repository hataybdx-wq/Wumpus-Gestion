const { EmbedBuilder, ChannelType } = require('discord.js')
const TYPES = {
  [ChannelType.GuildText]:          'Salon textuel',
  [ChannelType.GuildVoice]:         'Salon vocal',
  [ChannelType.GuildCategory]:      'Catégorie',
  [ChannelType.GuildAnnouncement]:  'Annonces',
  [ChannelType.GuildForum]:         'Forum',
  [ChannelType.GuildStageVoice]:    'Scène',
}
module.exports = {
  name: 'channelinfo',
  description: 'Informations sur un salon',
  aliases: ['channel-info', 'ci'],
  run: async (client, message, args) => {
    const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel
    const created = Math.floor(ch.createdTimestamp / 1000)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Salon · ${ch.name}`)
      .setColor(0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'ID',       value: `\`${ch.id}\``,                inline: true },
        { name: 'Type',     value: TYPES[ch.type] || 'Autre',     inline: true },
        { name: 'NSFW',     value: ch.nsfw ? 'Oui' : 'Non',       inline: true },
        { name: 'Slowmode', value: ch.rateLimitPerUser ? `${ch.rateLimitPerUser}s` : 'Aucun', inline: true },
        { name: 'Catégorie', value: ch.parent ? ch.parent.name : 'Aucune', inline: true },
        { name: 'Position', value: `${ch.rawPosition}`, inline: true },
        { name: 'Créé',     value: `<t:${created}:R>`, inline: false },
        ...(ch.topic ? [{ name: 'Sujet', value: ch.topic.slice(0, 1024) }] : []),
      )
    ] })
  },
}
