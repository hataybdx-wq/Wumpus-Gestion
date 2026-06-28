// ============================================================
//  Commande : support-list
//  Affiche tous les membres ayant le rôle de soutien.
// ============================================================

const { EmbedBuilder } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'support-list',
  description: 'Liste tous les membres qui soutiennent en ce moment',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const roleId = db.get(`${message.guild.id}.support.roleId`)
    const active = db.get(`${message.guild.id}.support.active`)

    if (!active || !roleId)
      return message.reply('Le système de soutien n\'est pas configuré.')

    const role = message.guild.roles.cache.get(roleId)
    if (!role) return message.reply('Le rôle de soutien est introuvable.')

    const supporters = message.guild.members.cache.filter(m => m.roles.cache.has(roleId) && !m.user.bot)

    const list = supporters.size
      ? supporters.map((m, i) => `**${i + 1}.** ${m.user.username}`).join('\n').slice(0, 4000)
      : '*Aucun supporter pour l\'instant.*'

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Supporters de ${message.guild.name} (${supporters.size})`)
      .setDescription(list)
      .setColor(0xFFD700)
      .setFooter({ text: `Rôle : ${role.name} | Made by Wumpus` })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
