// ============================================================
//  Commande : ban — Bannissement définitif
//  v14 : member.ban({ reason }) au lieu de member.ban(string)
//        member.user.tag déprécié → member.user.username
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')

module.exports = {
  name: 'ban',
  description: 'Bannit définitivement un membre du serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return

    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) member = await message.guild.members.fetch(args[0]).catch(() => null)
    if (!member) return message.reply('❌ Aucune personne trouvée !')

    if (member.id === message.author.id) return message.reply('❌ Vous ne pouvez pas vous bannir vous-même !')
    if (!member.bannable) return message.reply('❌ Je ne peux pas bannir ce membre (rôle supérieur) !')

    const raison = args.slice(1).join(' ') || 'Aucune raison donnée'

    await member.ban({ reason: `Banni par ${message.author.username} — ${raison}` })
    message.reply(`✅ **${member.user.username}** a été banni par ${message.author.username} (\`${raison}\`)`)

    sendLog(message.guild, 'mod', 'Membre banni',
      `**Banni :** <@${member.id}>\n**Par :** <@${message.author.id}>\n**Raison :** ${raison}`, 0xFF4444)
  },
}
