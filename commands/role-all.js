// ============================================================
//  Commande : role-all
//  Ajouter un rôle à tous les membres du serveur.
//
//  Sous-commandes :
//    !role-all @rôle              → ajouter à tous (humains)
//    !role-all @rôle bots         → ajouter aux bots seulement
//    !role-all @rôle humans       → humains seulement (défaut)
//    !role-all @rôle all          → tout le monde (humains + bots)
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  EmbedBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js')

const BATCH_SIZE = 5
const BATCH_DELAY = 1100  // 1.1s entre batches (évite rate limit)

module.exports = {
  name: 'role-all',
  description: 'Ajouter un rôle à tous les membres du serveur',
  aliases: ['roleall', 'role-tous', 'giverole-all'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    if (!role) return message.reply(`Usage : \`${prefix}role-all @rôle [humans|bots|all]\``)

    // Vérifier hiérarchie
    const me = message.guild.members.me
    if (role.position >= me.roles.highest.position) {
      return message.reply('Je ne peux pas attribuer ce rôle : il est au-dessus du mien.')
    }
    if (role.managed) {
      return message.reply('Ce rôle est géré par une intégration et ne peut pas être attribué.')
    }

    const filter = (args[1] || 'humans').toLowerCase()

    // Récupérer tous les membres
    const wait = await message.reply('Récupération des membres...')
    await message.guild.members.fetch().catch(() => false)

    let members = message.guild.members.cache.filter(m => !m.roles.cache.has(role.id))
    if (filter === 'humans') members = members.filter(m => !m.user.bot)
    else if (filter === 'bots') members = members.filter(m => m.user.bot)
    // 'all' → pas de filtre supplémentaire

    const total = members.size
    if (total === 0) return wait.edit('Aucun membre n\'a besoin de ce rôle.')

    // Confirmation avec bouton
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ra_confirm').setLabel('Confirmer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ra_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    )

    const estMin = Math.ceil((total * BATCH_DELAY / BATCH_SIZE) / 60000)

    await wait.edit({
      content: null,
      embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('Confirmation — Ajouter un rôle à tous')
        .setColor(0xFF8800)
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `Vous allez ajouter <@&${role.id}> à **${total}** membre(s).\n\n` +
          `**Filtre :** \`${filter}\`\n` +
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
      if (i.customId === 'ra_cancel') {
        return i.update({ content: 'Action annulée.', embeds: [], components: [] })
      }

      await i.update({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
          .setTitle('En cours...')
          .setColor(0xFF0000)
          .setDescription(`0 / ${total}`)],
          .setFooter({ text: 'Made by Wumpus' })
        components: [],
      })

      let done = 0, failed = 0
      const members_arr = [...members.values()]

      for (let idx = 0; idx < members_arr.length; idx += BATCH_SIZE) {
        const batch = members_arr.slice(idx, idx + BATCH_SIZE)
        await Promise.all(batch.map(m =>
          m.roles.add(role.id, `role-all par ${message.author.tag}`)
            .then(() => done++)
            .catch(() => failed++)
        ))

        // Update progress toutes les 3 batches
        if ((idx / BATCH_SIZE) % 3 === 0) {
          wait.edit({
            embeds: [new EmbedBuilder()
              .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
              .setTitle('En cours...')
              .setColor(0xFF0000)
              .setDescription(`**${done + failed} / ${total}**\nRéussis : ${done} · Échecs : ${failed}`)],
              .setFooter({ text: 'Made by Wumpus' })
          }).catch(() => false)
        }

        if (idx + BATCH_SIZE < members_arr.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY))
        }
      }

      wait.edit({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
          .setTitle('Terminé')
          .setColor(0x00FF88)
          .setDescription(
          .setFooter({ text: 'Made by Wumpus' })
            `Le rôle <@&${role.id}> a été ajouté à **${done}** membre(s).\n` +
            (failed > 0 ? `**${failed}** échec(s) (permissions manquantes).` : '')
          )],
      }).catch(() => false)
    })

    col.on('end', (collected) => {
      if (collected.size === 0) {
        wait.edit({
          content: 'Temps écoulé, action annulée.',
          embeds: [], components: [],
        }).catch(() => false)
      }
    })
  },
}
