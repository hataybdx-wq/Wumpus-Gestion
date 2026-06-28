const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'serverstats',
  description: 'Statistiques détaillées du serveur',
  aliases: ['serverinfo2', 'stats2'],
  run: async (client, message) => {
    const g = message.guild
    await g.members.fetch().catch(() => {})

    const humans = g.members.cache.filter(m => !m.user.bot).size
    const bots   = g.members.cache.filter(m => m.user.bot).size
    const online = g.members.cache.filter(m => m.presence && m.presence.status !== 'offline' && !m.user.bot).size
    const text   = g.channels.cache.filter(c => c.isTextBased()).size
    const voice  = g.channels.cache.filter(c => c.isVoiceBased()).size
    const cats   = g.channels.cache.filter(c => c.type === 4).size
    const inVoice = g.voiceStates.cache.size
    const emojis = g.emojis.cache.size
    const created = Math.floor(g.createdTimestamp / 1000)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Stats détaillées · ${g.name}`)
      .setColor(0xFF0000)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Membres',     value: `👥 ${g.memberCount}\n🧑 ${humans} humains\n🤖 ${bots} bots\n🟢 ${online} en ligne`, inline: true },
        { name: 'Salons',      value: `💬 ${text} textuels\n🎙️ ${voice} vocaux\n📁 ${cats} catégories\n🔊 ${inVoice} en vocal`, inline: true },
        { name: 'Autres',      value: `🎭 ${g.roles.cache.size} rôles\n😀 ${emojis} emojis\n🚀 ${g.premiumSubscriptionCount || 0} boosts\n🎚️ Niveau ${g.premiumTier}`, inline: true },
        { name: 'Propriétaire', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Créé',         value: `<t:${created}:R>`, inline: true },
        { name: 'Facteur boost', value: `Tier ${g.premiumTier}/3`, inline: true },
      )
    ] })
  },
}
