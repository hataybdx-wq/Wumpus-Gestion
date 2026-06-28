module.exports = {
  name: 'membercount',
  description: 'Nombre de membres détaillé',
  aliases: ['mc', 'memcount'],
  run: async (client, message) => {
    const g = message.guild
    await g.members.fetch().catch(() => {})
    const humans = g.members.cache.filter(m => !m.user.bot).size
    const bots   = g.members.cache.filter(m => m.user.bot).size
    const online = g.members.cache.filter(m => m.presence && m.presence.status !== 'offline' && !m.user.bot).size
    message.reply(
      `👥 Total : **${g.memberCount}**\n` +
      `🧑 Humains : **${humans}** · 🤖 Bots : **${bots}**\n` +
      `🟢 En ligne : **${online}**`
    )
  },
}
