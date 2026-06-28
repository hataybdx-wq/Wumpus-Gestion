// ============================================================
//  Commande : selfroles
//  Panneau de rôles auto-assignables.
//
//  Les membres cliquent sur un select menu pour prendre/retirer
//  des rôles eux-mêmes (rôles de notification, intérêts…).
//
//  Sous-commandes :
//    !selfroles create <titre>   → créer un nouveau panneau (interactif)
//    !selfroles add <id> @rôle <description>  → ajouter un rôle
//    !selfroles remove <id> @rôle             → retirer un rôle
//    !selfroles list                          → lister les panneaux
//    !selfroles delete <id>                   → supprimer un panneau
//    !selfroles panel <id> [#salon]           → envoyer/renvoyer le panneau
//
//  Stockage : `selfroles_${gid}` = { [panelId]: { title, description, roles: [{id, desc, emoji}], channelId, messageId } }
//
//  Réservé aux ADMINISTRATEURS.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

function genId() {
  return 'sr' + Math.random().toString(36).slice(2, 8)
}

function getAll(gid) {
  return db.get(`selfroles_${gid}`) || {}
}

function savePanel(gid, id, data) {
  const all = getAll(gid)
  all[id] = data
  db.set(`selfroles_${gid}`, all)
}

function buildPanelComponents(panel) {
  const container = new ContainerBuilder().setAccentColor(0xFF0000)

  container.addTextDisplayComponents(td => td.setContent(`## ${panel.title}`))
  if (panel.description) {
    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    container.addTextDisplayComponents(td => td.setContent(panel.description))
  }

  if (!panel.roles || panel.roles.length === 0) {
    container.addTextDisplayComponents(td => td.setContent('-# Aucun rôle configuré pour ce panneau.'))
    return container
  }

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  // Liste des rôles avec description
  const lines = panel.roles.map(r =>
    (r.emoji ? `${r.emoji} ` : '') + `<@&${r.id}> — ${r.desc || 'Aucune description'}`
  ).join('\n')
  container.addTextDisplayComponents(td => td.setContent(lines))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Select menu avec les options
  const select = new StringSelectMenuBuilder()
    .setCustomId(`selfrole_${panel.id}`)
    .setPlaceholder('Sélectionner des rôles')
    .setMinValues(0)
    .setMaxValues(panel.roles.length)
    .addOptions(
      panel.roles.map(r => {
        const opt = new StringSelectMenuOptionBuilder()
          .setLabel(r.label || `Rôle`)
          .setValue(r.id)
          .setFooter({ text: 'Made by Wumpus' })
        if (r.desc) opt.setDescription(r.desc.slice(0, 100))
        if (r.emoji) opt.setEmoji(r.emoji)
        return opt
      })
    )

  container.addActionRowComponents(row => row.setComponents(select))
  return container
}

module.exports = {
  name: 'selfroles',
  description: 'Créer un panneau de rôles auto-assignables',
  aliases: ['selfrole', 'self-role'],
  buildPanelComponents,  // exporté pour l'interaction handler

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    // ── create <titre> ──────────────────────────────────────
    if (sub === 'create' || sub === 'new') {
      const title = args.slice(1).join(' ') || 'Rôles disponibles'
      const id    = genId()

      const panel = { id, title, description: null, roles: [], channelId: null, messageId: null }
      savePanel(gid, id, panel)

      return message.reply(
        `Panneau créé : \`${id}\`\n` +
        `**Prochaines étapes :**\n` +
        `> \`${prefix}selfroles add ${id} @rôle <description>\`\n` +
        `> \`${prefix}selfroles desc ${id} <description du panneau>\`\n` +
        `> \`${prefix}selfroles panel ${id}\` · envoyer le panneau ici`
      )
    }

    // ── list ──────────────────────────────────────────────
    if (sub === 'list' || !sub) {
      const all = getAll(gid)
      const panels = Object.values(all)

      if (panels.length === 0) {
        return message.reply(
          `Aucun panneau de selfroles créé.\n` +
          `Créez-en un avec \`${prefix}selfroles create <titre>\``
        )
      }

      const lines = panels.map(p =>
        `**${p.title}** · \`${p.id}\` · ${p.roles.length} rôle(s)` +
        (p.channelId ? ` · <#${p.channelId}>` : ' · *non envoyé*')
      )

      return message.reply({ embeds: [{
        title: 'Panneaux de selfroles',
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
        description: lines.join('\n'),
        color: 0xFF0000,
        author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      }] })
    }

    // ── add <id> @rôle [description] ──────────────────────
    if (sub === 'add') {
      const pid = args[1]
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2])
      const desc = args.slice(role ? 3 : 2).join(' ')

      if (!pid || !role) {
        return message.reply(`Usage : \`${prefix}selfroles add <id_panneau> @rôle <description>\``)
      }

      const panel = getAll(gid)[pid]
      if (!panel) return message.reply(`Panneau \`${pid}\` introuvable.`)

      // Retirer si déjà présent puis ajouter (update)
      panel.roles = panel.roles.filter(r => r.id !== role.id)
      panel.roles.push({ id: role.id, label: role.name, desc: desc || null, emoji: null })
      savePanel(gid, pid, panel)

      // Mise à jour du panneau si déjà envoyé
      await updatePanelMessage(client, message.guild, panel)

      return message.reply(`<@&${role.id}> ajouté au panneau \`${pid}\`.`)
    }

    // ── remove <id> @rôle ─────────────────────────────────
    if (sub === 'remove' || sub === 'rm') {
      const pid = args[1]
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2])
      if (!pid || !role) return message.reply(`Usage : \`${prefix}selfroles remove <id_panneau> @rôle\``)

      const panel = getAll(gid)[pid]
      if (!panel) return message.reply(`Panneau \`${pid}\` introuvable.`)

      panel.roles = panel.roles.filter(r => r.id !== role.id)
      savePanel(gid, pid, panel)
      await updatePanelMessage(client, message.guild, panel)

      return message.reply(`<@&${role.id}> retiré du panneau \`${pid}\`.`)
    }

    // ── desc <id> <description> ───────────────────────────
    if (sub === 'desc' || sub === 'description') {
      const pid = args[1]
      const desc = args.slice(2).join(' ')
      if (!pid || !desc) return message.reply(`Usage : \`${prefix}selfroles desc <id> <description>\``)

      const panel = getAll(gid)[pid]
      if (!panel) return message.reply(`Panneau \`${pid}\` introuvable.`)

      panel.description = desc
      savePanel(gid, pid, panel)
      await updatePanelMessage(client, message.guild, panel)

      return message.reply(`Description mise à jour pour le panneau \`${pid}\`.`)
    }

    // ── title <id> <titre> ────────────────────────────────
    if (sub === 'title' || sub === 'titre') {
      const pid = args[1]
      const title = args.slice(2).join(' ')
      if (!pid || !title) return message.reply(`Usage : \`${prefix}selfroles title <id> <nouveau titre>\``)

      const panel = getAll(gid)[pid]
      if (!panel) return message.reply(`Panneau \`${pid}\` introuvable.`)

      panel.title = title
      savePanel(gid, pid, panel)
      await updatePanelMessage(client, message.guild, panel)

      return message.reply(`Titre mis à jour pour le panneau \`${pid}\`.`)
    }

    // ── panel <id> [#salon] ───────────────────────────────
    if (sub === 'panel' || sub === 'send') {
      const pid = args[1]
      if (!pid) return message.reply(`Usage : \`${prefix}selfroles panel <id> [#salon]\``)

      const panel = getAll(gid)[pid]
      if (!panel) return message.reply(`Panneau \`${pid}\` introuvable.`)
      if (panel.roles.length === 0) return message.reply('Ajoutez au moins un rôle avant d\'envoyer le panneau.')

      const targetCh = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]) || message.channel

      const container = buildPanelComponents(panel)
      const sent = await targetCh.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null)
      if (!sent) return message.reply('Erreur d\'envoi (permissions manquantes ?)')

      panel.channelId = targetCh.id
      panel.messageId = sent.id
      savePanel(gid, pid, panel)

      return message.reply(`Panneau \`${pid}\` envoyé dans <#${targetCh.id}>.`)
    }

    // ── delete <id> ───────────────────────────────────────
    if (sub === 'delete' || sub === 'del') {
      const pid = args[1]
      if (!pid) return message.reply(`Usage : \`${prefix}selfroles delete <id>\``)

      const all = getAll(gid)
      if (!all[pid]) return message.reply(`Panneau \`${pid}\` introuvable.`)

      // Supprimer le message si possible
      const panel = all[pid]
      if (panel.channelId && panel.messageId) {
        const ch = message.guild.channels.cache.get(panel.channelId)
        if (ch) ch.messages.delete(panel.messageId).catch(() => false)
      }

      delete all[pid]
      db.set(`selfroles_${gid}`, all)
      return message.reply(`Panneau \`${pid}\` supprimé.`)
    }

    // Aide
    message.reply(
      `**${prefix}selfroles create <titre>** · Créer un panneau\n` +
      `**${prefix}selfroles list** · Voir les panneaux\n` +
      `**${prefix}selfroles add <id> @rôle <description>** · Ajouter un rôle\n` +
      `**${prefix}selfroles remove <id> @rôle** · Retirer un rôle\n` +
      `**${prefix}selfroles title <id> <titre>** · Changer le titre\n` +
      `**${prefix}selfroles desc <id> <description>** · Changer la description\n` +
      `**${prefix}selfroles panel <id> [#salon]** · Envoyer le panneau\n` +
      `**${prefix}selfroles delete <id>** · Supprimer un panneau`
    )
  },
}

async function updatePanelMessage(client, guild, panel) {
  if (!panel.channelId || !panel.messageId) return
  const ch = guild.channels.cache.get(panel.channelId)
  if (!ch) return
  const msg = await ch.messages.fetch(panel.messageId).catch(() => null)
  if (!msg) return

  const container = buildPanelComponents(panel)
  msg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
}
