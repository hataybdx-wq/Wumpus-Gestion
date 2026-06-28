module.exports = {
  name: 'invite-guild',
  description: 'Génère un lien d\'invitation pour un serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const invite = await message.channel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null)
    if (!invite) return message.reply('❌ Impossible de créer une invitation.')

    await message.delete().catch(() => false)
    message.author.send(`**Invitation de __${message.guild.name}__ :**\n\nhttps://discord.gg/${invite.code}`)
      .catch(() => false)
  },
}
