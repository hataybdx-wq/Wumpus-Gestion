// ============================================================
//  Commande : kick — Expulsion
//  v14 : PermissionFlagsBits, user.username (tag déprécié)
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')

module.exports = {
  name: 'kick',
  description: 'Expulse un membre du serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return

    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) member = await message.guild.members.fetch(args[0]).catch(() => null)
    if (!member) return message.reply('❌ Aucune personne trouvée !')
    if (member.id === message.author.id) return message.reply('❌ Vous ne pouvez pas vous expulser vous-même !')
    if (!member.kickable) return message.reply('❌ Je ne peux pas expulser ce membre (rôle supérieur) !')

    const raison = args.slice(1).join(' ') || 'Aucune raison donnée'

    await member.kick(`Expulsé par ${message.author.username} — ${raison}`)
    message.reply(`✅ **${member.user.username}** a été expulsé par ${message.author.username} (\`${raison}\`)`)

    sendLog(message.guild, 'mod', 'Membre expulsé',
      `**Expulsé :** <@${member.id}>\n**Par :** <@${message.author.id}>\n**Raison :** ${raison}`, 0xFF8800)
  },
}
