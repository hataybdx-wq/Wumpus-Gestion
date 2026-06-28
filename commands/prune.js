// ============================================================
//  Commande : prune — Supprimer messages d'un membre spécifique
// ============================================================

const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'prune',
  description: 'Supprime les messages d\'un membre spécifique',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) return message.reply('❌ Aucune personne trouvée !')

    const amount = Math.min(Math.max(parseInt(args[1]) || 0, 1), 100)
    if (!args[1] || isNaN(parseInt(args[1]))) return message.reply('❌ Veuillez indiquer un nombre entre `1` et `100` !')

    const messages = await message.channel.messages.fetch({ limit: amount }).catch(() => null)
    if (!messages) return message.reply('❌ Impossible de récupérer les messages.')

    const filtered = messages.filter(m => m.author.id === member.id)
    if (filtered.size === 0) return message.reply('❌ Aucun message récent de ce membre trouvé.')

    await message.channel.bulkDelete(filtered, true)
      .then(async deleted => {
        const msg = await message.channel.send(`✅ \`${deleted.size}\` messages de <@${member.id}> supprimés.`)
        setTimeout(() => msg.delete().catch(() => false), 5000)
      })
      .catch(() => message.reply('❌ Impossible de supprimer ces messages.'))
  },
}
