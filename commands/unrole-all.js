// ============================================================
//  Commande : unrole-all
//  Retirer un rôle à tous les membres du serveur.
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  EmbedBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js')

const BATCH_SIZE = 5
const BATCH_DELAY = 1100

module.exports = {
  name: 'unrole-all',
  description: 'Retirer un rôle à tous les membres du serveur',
  aliases: ['unroleall', 'remove-role-all'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    if (!role) return message.reply(`Usage : \`${prefix}unrole-all @rôle\``)

    const me = message.guild.members.me
    if (role.position >= me.roles.highest.position) {
      return message.reply('Je ne peux pas gérer ce rôle : il est au-dessus du mien.')
    }
    if (role.managed) {
      return message.reply('Ce rôle est géré par une intégration.')
    }

    const wait = await message.reply('Récupération des membres...')
    await message.guild.members.fetch().catch(() => false)

    const members = message.guild.members.cache.filter(m => m.roles.cache.has(role.id))
    const total   = members.size
    if (total === 0) return wait.edit('Aucun membre n\'a ce rôle.')

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ua_confirm').setLabel('Confirmer').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ua_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    )

    const estMin = Math.ceil((total * BATCH_DELAY / BATCH_SIZE) / 60000)

    await wait.edit({
      content: null,
      embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Confirmation — Retirer un rôle à tous')
        .setColor(0xFF8800)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `Vous allez retirer <@&${role.id}> à **${total}** membre(s).\n\n` +
          `**Durée estimée :** ~${estMin} minute(s)\n\n` +
          `Cette action est longue et soumise aux rate limits de Discord.`
        )],
      components: [confirmRow],
    })

    const col = wait.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000, max: 1,
    })

    col.on('collect', async i => {
      if (i.customId === 'ua_cancel') {
        return i.update({ content: 'Action annulée.', embeds: [], components: [] })
      }

      await i.update({
        embeds: [new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setTitle('En cours...').setColor(0xFF0000).setDescription(`0 / ${total}`)],
        components: [],
      })

      let done = 0, failed = 0
      const arr = [...members.values()]

      for (let idx = 0; idx < arr.length; idx += BATCH_SIZE) {
        const batch = arr.slice(idx, idx + BATCH_SIZE)
        await Promise.all(batch.map(m =>
          m.roles.remove(role.id, `unrole-all par ${message.author.tag}`)
            .then(() => done++)
            .catch(() => failed++)
        ))

        if ((idx / BATCH_SIZE) % 3 === 0) {
          wait.edit({
            embeds: [new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setTitle('En cours...').setColor(0xFF0000)
              .setDescription(`**${done + failed} / ${total}**\nRéussis : ${done} · Échecs : ${failed}`)],
              .setFooter({ text: 'Made by Wumpus' })
          }).catch(() => false)
        }

        if (idx + BATCH_SIZE < arr.length) await new Promise(r => setTimeout(r, BATCH_DELAY))
      }

      wait.edit({
        embeds: [new EmbedBuilder().setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' }).setTitle('Terminé').setColor(0x00FF88)
          .setDescription(
          .setFooter({ text: 'Made by Wumpus' })
            `Le rôle <@&${role.id}> a été retiré à **${done}** membre(s).\n` +
            (failed > 0 ? `**${failed}** échec(s).` : '')
          )],
      }).catch(() => false)
    })

    col.on('end', (collected) => {
      if (collected.size === 0) {
        wait.edit({ content: 'Temps écoulé.', embeds: [], components: [] }).catch(() => false)
      }
    })
  },
}
