// ============================================================
//  Commande : support-reward
//  Définit le message envoyé en DM quand un membre reçoit
//  le rôle de soutien (statut détecté).
//  Variables disponibles : {user} {server} {role}
//
//  Usage : !support-reward Merci {user} de soutenir {server} !
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'support-reward',
  description: 'Définit le message DM envoyé aux supporters',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    // Sous-commande : reset-dm @membre ou reset-dm all
    if (args[0] === 'reset-dm') {
      const target = message.mentions.members.first()
      if (target) {
        db.delete(`support_dm_sent_${message.guild.id}_${target.id}`)
        return message.reply(`Le DM de soutien sera à nouveau envoyé à <@${target.id}> à la prochaine détection.`)
      }
      if (args[1] === 'all') {
        // Pour "all", il faudrait itérer sur toutes les clés — on stocke la liste
        return message.reply(
          `Pour réinitialiser un membre en particulier : \`${prefix}support-reward reset-dm @membre\``
        )
      }
      return message.reply(`Usage : \`${prefix}support-reward reset-dm @membre\``)
    }

    if (!args[0]) {
      const current = db.get(`${message.guild.id}.support.reward`)
      return message.reply(
        `**Message de récompense actuel :**\n> ${current ?? 'Aucun'}\n\n` +
        `**Usage :** \`${prefix}support-reward <message>\`\n` +
        `**Variables :** \`{user}\` \`{server}\` \`{role}\`\n\n` +
        `**Réinitialiser le DM d'un membre** (pour qu'il le reçoive à nouveau) :\n` +
        `> \`${prefix}support-reward reset-dm @membre\``
      )
    }

    const msg = args.join(' ')
    db.set(`${message.guild.id}.support.reward`, msg)
    message.reply(`Message de récompense enregistré :\n> ${msg}\n\n-# Le DM n'est envoyé **qu'une seule fois** par membre.`)
  },
}
