// ============================================================
//  Commande : autorole
//  Attribuer automatiquement des rôles aux nouveaux membres.
//
//  Utilise RoleSelectMenu (sélecteur de rôles natif Discord).
//
//  Sous-commandes :
//    !autorole                → interface de configuration
//    !autorole add @rôle      → ajouter un rôle
//    !autorole remove @rôle   → retirer un rôle
//    !autorole list           → voir les rôles configurés
//    !autorole clear          → tout supprimer
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'autorole',
  description: 'Attribuer automatiquement des rôles aux nouveaux membres',
  aliases: ['auto-role'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── add <@rôle> ───────────────────────────────────────
    if (sub === 'add') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1])
      if (!role) return message.reply(`Usage : \`${prefix}autorole add @rôle\``)

      const list = db.get(`autoroles_${gid}`) || []
      if (list.includes(role.id)) return message.reply(`<@&${role.id}> est déjà dans la liste.`)

      list.push(role.id)
      db.set(`autoroles_${gid}`, list)
      return message.reply(`<@&${role.id}> sera maintenant attribué aux nouveaux membres.`)
    }

    // ── remove <@rôle> ────────────────────────────────────
    if (sub === 'remove' || sub === 'rm') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1])
      if (!role) return message.reply(`Usage : \`${prefix}autorole remove @rôle\``)

      const list = db.get(`autoroles_${gid}`) || []
      const filtered = list.filter(id => id !== role.id)
      if (filtered.length === list.length) return message.reply(`<@&${role.id}> n'est pas dans la liste.`)

      db.set(`autoroles_${gid}`, filtered)
      return message.reply(`<@&${role.id}> retiré de la liste.`)
    }

    // ── clear ─────────────────────────────────────────────
    if (sub === 'clear' || sub === 'reset') {
      db.set(`autoroles_${gid}`, [])
      return message.reply('Tous les auto-rôles ont été supprimés.')
    }

    // ── list (défaut) — interface moderne ──────────────────
    const list = db.get(`autoroles_${gid}`) || []

    const container = new ContainerBuilder().setAccentColor(0xFF0000)

    container.addTextDisplayComponents(td => td.setContent(
      `## Auto-rôles\n-# Rôles attribués automatiquement à l'arrivée des membres`
    ))
    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

    container.addTextDisplayComponents(td => td.setContent(
      list.length === 0
        ? 'Aucun auto-rôle configuré.\n\nSélectionnez un ou plusieurs rôles dans le menu ci-dessous pour les attribuer automatiquement à chaque nouveau membre.'
        : `**${list.length}** auto-rôle(s) actif(s) :\n${list.map(id => `> <@&${id}>`).join('\n')}\n\nSélectionnez de nouveaux rôles dans le menu pour les ajouter.`
    ))

    container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

    // RoleSelectMenu - sélecteur natif de rôles Discord
    const selectRoles = new RoleSelectMenuBuilder()
      .setCustomId(`autorole_add_${message.author.id}`)
      .setPlaceholder('Ajouter un ou plusieurs rôles')
      .setMinValues(1)
      .setMaxValues(10)

    container.addActionRowComponents(row => row.setComponents(selectRoles))

    if (list.length > 0) {
      container.addActionRowComponents(row => row.setComponents(
        new ButtonBuilder()
          .setCustomId(`autorole_clear_${message.author.id}`)
          .setLabel('Tout supprimer')
          .setStyle(ButtonStyle.Danger),
      ))
    }

    container.addTextDisplayComponents(td => td.setContent(
      `-# \`${prefix}autorole add/remove/clear\` pour gérer manuellement`
    ))

    const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 })

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 180000,
    })

    col.on('collect', async i => {
      const current = db.get(`autoroles_${gid}`) || []

      if (i.customId.startsWith('autorole_add_') && i.isRoleSelectMenu()) {
        const selected = i.values
        const newList  = [...new Set([...current, ...selected])]
        db.set(`autoroles_${gid}`, newList)

        await i.reply({
          content: `${selected.length} rôle(s) ajouté(s) aux auto-rôles.\n${selected.map(id => `> <@&${id}>`).join('\n')}`,
          flags: 64,
        })
      }

      if (i.customId.startsWith('autorole_clear_')) {
        db.set(`autoroles_${gid}`, [])
        await i.reply({ content: 'Tous les auto-rôles supprimés.', flags: 64 })
      }
    })

    col.on('end', () => {
      msg.edit({ components: [
        new ContainerBuilder().setAccentColor(0xFF0000)
          .addTextDisplayComponents(td => td.setContent(
            `## Auto-rôles\n-# Menu expiré · \`${prefix}autorole\` pour rouvrir`
          )),
      ], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
    })
  },
}
