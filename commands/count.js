module.exports = {
  name: 'count',
  description: 'Compteurs rapides du serveur',
  aliases: ['counts'],
  run: async (client, message) => {
    const g = message.guild
    const humans = g.members.cache.filter(m => !m.user.bot).size
    const bots   = g.members.cache.filter(m => m.user.bot).size
    message.reply(
      `**${g.name}** · ${g.memberCount} membres\n` +
      `👥 ${humans} humains · 🤖 ${bots} bots\n` +
      `💬 ${g.channels.cache.size} salons · 🎭 ${g.roles.cache.size} rôles · 🚀 ${g.premiumSubscriptionCount || 0} boosts`
    )
  },
}
