// ============================================================
//  Commande : ticket
//  Commande unifiée pour tout le système de tickets v3.
//
//  Sous-commandes :
//    !ticket setup          → Panel de configuration interactif
//    !ticket new [type]     → Ouvrir un ticket manuellement
//    !ticket close [raison] → Fermer le ticket actuel
//    !ticket claim          → Prendre en charge
//    !ticket add @user      → Ajouter un membre
//    !ticket remove @user   → Retirer un membre
//    !ticket list [@user]   → Lister les tickets ouverts
//    !ticket prio <niveau>  → Changer la priorité
//    !ticket stats          → Statistiques du serveur
//    !ticket reset          → Réinitialiser la config (admin)
//    !ticket help           → Aide
//
//  Aliases : t, tkt
// ============================================================
'use strict'

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  PermissionFlagsBits, MessageFlags, ChannelType,
} = require('discord.js')
const db = require('quick.db')
const {
  PRIORITY, KEY,
  cfg, saveCfg, resetCfg,
  createTicket, requestClose, confirmClose,
  buildPanel, buildSetupPanel, buildOpenModal, buildPrioPanel,
} = require('../utils/tickets')

module.exports = {
  name: 'ticket',
  description: 'Système de tickets v3 — commande unifiée',
  aliases: ['t', 'tkt'],

  run: async (client, message, args, prefix) => {
    const sub = (args[0] || 'help').toLowerCase()
    const gid = message.guild.id

    // ── setup ─────────────────────────────────────────────────
    if (sub === 'setup' || sub === 'config') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
        return message.reply('❌ Réservé aux administrateurs.')

      const userId = message.author.id
      const msg = await message.reply({
        components: [buildSetupPanel(message.guild, userId)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null)
      if (!msg) return

      const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        time: 900_000,
      })

      col.on('collect', async i => {
        const id = i.customId
        const config = cfg(gid)

        // Setup express
        if (id === `tkt:setup:auto:${userId}`) {
          await i.deferUpdate()
          try {
            const guild = message.guild

            let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && /ticket/i.test(c.name))
            if (!cat) cat = await guild.channels.create({
              name: '🎫 Tickets', type: ChannelType.GuildCategory,
              permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }],
            })

            let staff = guild.roles.cache.find(r => /support|staff/i.test(r.name) && !r.managed)
            if (!staff) staff = await guild.roles.create({ name: 'Support', color: 0xE74C3C, reason: 'Ticket v3 setup' })

            let panel = guild.channels.cache.find(c => /crée?-?ticket|ticket-panel/i.test(c.name))
            if (!panel) panel = await guild.channels.create({
              name: 'créer-un-ticket', type: ChannelType.GuildText, parent: cat.id,
              permissionOverwrites: [
                { id: guild.id,       allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel] },
              ],
            })

            let logs = guild.channels.cache.find(c => /ticket.*log|log.*ticket/i.test(c.name))
            if (!logs) logs = await guild.channels.create({
              name: 'ticket-logs', type: ChannelType.GuildText, parent: cat.id,
              permissionOverwrites: [
                { id: guild.id,       deny:  [PermissionFlagsBits.ViewChannel] },
                { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] },
                { id: staff.id,       allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
              ],
            })

            const newCfg = {
              enabled: true,
              categoryId: cat.id, staffRoleId: staff.id,
              panelChannelId: panel.id, logsChannelId: logs.id,
              maxOpen: 1, mention: true, transcript: true,
              autoClose: null, types: [],
              openMessage: 'Bienvenue {user} ! Décrivez votre demande, le staff vous répondra dès que possible.',
              panelTitle: '🎫 Support — Ouvrir un ticket',
              panelDesc: 'Besoin d\'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket.',
              panelFooter: 'Notre équipe vous répondra dès que possible.',
            }
            saveCfg(gid, newCfg)

            const sent = await panel.send({ components: [buildPanel(guild, newCfg)], flags: MessageFlags.IsComponentsV2 })
            newCfg.panelMsgId = sent.id
            saveCfg(gid, newCfg)

            await i.editReply({
              content: `✅ **Setup express terminé !** · ${cat} · ${staff} · ${panel} · ${logs}`,
              components: [buildSetupPanel(guild, userId)],
              flags: MessageFlags.IsComponentsV2,
            }).catch(() => {})
          } catch (err) {
            await i.followUp({ content: `❌ Erreur : ${err.message}`, flags: 64 })
          }
          return
        }

        // Toggles
        if (id === `tkt:setup:toggle:${userId}`) {
          config.enabled = !config.enabled
          saveCfg(gid, config)
          await i.update({ components: [buildSetupPanel(message.guild, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }
        if (id === `tkt:setup:transcript:${userId}`) {
          config.transcript = config.transcript === false ? true : false
          saveCfg(gid, config)
          await i.update({ components: [buildSetupPanel(message.guild, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }
        if (id === `tkt:setup:mention:${userId}`) {
          config.mention = config.mention === false ? true : false
          saveCfg(gid, config)
          await i.update({ components: [buildSetupPanel(message.guild, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }

        // Publier le panneau
        if (id === `tkt:setup:send:${userId}`) {
          const ch = message.guild.channels.cache.get(config.panelChannelId)
          if (!ch) { await i.reply({ content: '❌ Salon panneau introuvable.', flags: 64 }); return }
          const sent = await ch.send({ components: [buildPanel(message.guild, config)], flags: MessageFlags.IsComponentsV2 })
          config.panelMsgId = sent.id
          saveCfg(gid, config)
          await i.reply({ content: `✅ Panneau publié dans ${ch}`, flags: 64 })
          return
        }

        // Reset
        if (id === `tkt:setup:reset:${userId}`) {
          resetCfg(gid)
          await i.update({ components: [buildSetupPanel(message.guild, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }

        // Sélecteurs
        if (i.isStringSelectMenu()) {
          if (id === `tkt:setup:cat:${userId}`)   { config.categoryId     = i.values[0]; saveCfg(gid, config) }
          if (id === `tkt:setup:staff:${userId}`) { config.staffRoleId    = i.values[0]; saveCfg(gid, config) }
          if (id === `tkt:setup:panel:${userId}`) { config.panelChannelId = i.values[0]; saveCfg(gid, config) }
          if (id === `tkt:setup:logs:${userId}`)  { config.logsChannelId  = i.values[0]; saveCfg(gid, config) }
          await i.update({ components: [buildSetupPanel(message.guild, userId)], flags: MessageFlags.IsComponentsV2 })
          return
        }

        // Modaux
        if (id === `tkt:setup:maxopen:${userId}`) {
          await i.showModal(new ModalBuilder().setCustomId(`tkt:modal-setup:maxopen:${userId}`).setTitle('Max tickets par membre')
            .addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('v').setLabel('Nombre max (0 = illimité)').setStyle(TextInputStyle.Short).setPlaceholder('1').setMaxLength(2)
            )))
          return
        }
        if (id === `tkt:setup:autoclose:${userId}`) {
          await i.showModal(new ModalBuilder().setCustomId(`tkt:modal-setup:autoclose:${userId}`).setTitle('Auto-close (inactivité)')
            .addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('v').setLabel('Heures avant fermeture (0 = désactivé)').setStyle(TextInputStyle.Short).setPlaceholder('24').setMaxLength(3)
            )))
          return
        }
        if (id === `tkt:setup:welcome:${userId}`) {
          await i.showModal(new ModalBuilder().setCustomId(`tkt:modal-setup:welcome:${userId}`).setTitle('Message d\'accueil')
            .addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('v').setLabel('{user} {type} {server} disponibles').setStyle(TextInputStyle.Paragraph)
                .setValue(config.openMessage || 'Bienvenue {user} !').setMaxLength(500)
            )))
          return
        }
        if (id === `tkt:setup:title:${userId}`) {
          await i.showModal(new ModalBuilder().setCustomId(`tkt:modal-setup:title:${userId}`).setTitle('Titre + description du panneau')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short)
                  .setValue(config.panelTitle || '🎫 Support').setMaxLength(80)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('desc').setLabel('Description').setStyle(TextInputStyle.Paragraph)
                  .setValue(config.panelDesc || '').setMaxLength(400).setRequired(false)
              )
            ))
          return
        }
        if (id === `tkt:setup:addtype:${userId}`) {
          await i.showModal(new ModalBuilder().setCustomId(`tkt:modal-setup:addtype:${userId}`).setTitle('Ajouter un type de ticket')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('label').setLabel('Nom du type (ex: Aide, Report, Partenariat)').setStyle(TextInputStyle.Short).setMaxLength(40)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Emoji (optionnel)').setStyle(TextInputStyle.Short).setMaxLength(10).setRequired(false)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('desc').setLabel('Description courte (optionnel)').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(false)
              )
            ))
          return
        }

        // Soumission modaux setup → traités dans interactionCreate.js
        // (createMessageComponentCollector ne capture pas les modal submits)
      })

      col.on('end', () => {
        const end = new ContainerBuilder().setAccentColor(0xE74C3C)
        end.addTextDisplayComponents(td => td.setContent(
          `## ⚙️ Configuration Tickets v3\n-# Session expirée · \`${prefix}ticket setup\` pour rouvrir`
        ))
        msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
      })
      return
    }

    // ── new ───────────────────────────────────────────────────
    if (sub === 'new' || sub === 'open' || sub === 'create') {
      const config = cfg(gid)
      if (config.enabled === false) return message.reply('❌ Le système de tickets est désactivé.')
      const typeLabel = args.slice(1).join(' ') || null
      const typeData  = typeLabel
        ? (config.types || []).find(t => t.label.toLowerCase() === typeLabel.toLowerCase())
        : null
      const modal = buildOpenModal(typeData?.id || 'default', typeData?.label || typeLabel)
      // Pas de moyen d'afficher modal depuis message prefix → ouvre directement avec sujet vide
      const result = await createTicket(client, message.guild, message.member, {
        typeId: typeData?.id || 'default',
        typeLabel: typeData?.label || typeLabel || 'Général',
        priority: 'normal',
        subject: null, details: null,
      })
      if (!result.ok) return message.reply(`❌ ${result.error}`)
      return message.reply(`✅ Ticket créé : <#${result.channel.id}>`)
    }

    // ── close ─────────────────────────────────────────────────
    if (sub === 'close' || sub === 'fermer') {
      const ticketData = db.get(KEY.ch(message.channel.id))
      if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')
      const config = cfg(gid)
      const isOwner = ticketData.userId === message.author.id
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isOwner && !isStaff) return message.reply('❌ Seul le créateur ou un membre du staff peut fermer ce ticket.')
      const reason = args.slice(1).join(' ') || 'Aucune raison précisée'
      await requestClose(message.channel, message.member, reason)
      return
    }

    // ── claim ─────────────────────────────────────────────────
    if (sub === 'claim' || sub === 'prendre') {
      const ticketData = db.get(KEY.ch(message.channel.id))
      if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')
      const config = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')
      if (ticketData.claimedBy) return message.reply(`❌ Déjà pris en charge par <@${ticketData.claimedBy}>.`)

      ticketData.claimedBy  = message.author.id
      ticketData.claimedAt  = Date.now()
      db.set(KEY.ch(message.channel.id), ticketData)
      const allOpen = db.get(KEY.open(gid)) || {}
      if (allOpen[message.channel.id]) { allOpen[message.channel.id].claimedBy = message.author.id; db.set(KEY.open(gid), allOpen) }

      const c = new ContainerBuilder().setAccentColor(0x2ECC71)
      c.addTextDisplayComponents(td => td.setContent(
        `✋ **<@${message.author.id}> prend en charge ce ticket.**\n-# Votre demande est entre de bonnes mains.`
      ))
      message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 })

      try {
        const newName = message.channel.name.replace(/^([^-]+-[^-]+)/, `$1-[${message.member.displayName.toLowerCase().slice(0, 8)}]`)
        await message.channel.setName(newName)
      } catch {}
      return
    }

    // ── add ───────────────────────────────────────────────────
    if (sub === 'add') {
      const ticketData = db.get(KEY.ch(message.channel.id))
      if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')
      const config = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1])
      if (!target) return message.reply(`Usage : \`${prefix}ticket add @membre\``)
      await message.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      })
      return message.reply(`✅ **${target.user.username}** a été ajouté au ticket.`)
    }

    // ── remove ────────────────────────────────────────────────
    if (sub === 'remove' || sub === 'kick') {
      const ticketData = db.get(KEY.ch(message.channel.id))
      if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')
      const config = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1])
      if (!target) return message.reply(`Usage : \`${prefix}ticket remove @membre\``)
      if (target.id === ticketData.userId) return message.reply('❌ Impossible de retirer le créateur du ticket.')
      await message.channel.permissionOverwrites.edit(target.id, { ViewChannel: false })
      return message.reply(`✅ **${target.user.username}** a été retiré du ticket.`)
    }

    // ── list ──────────────────────────────────────────────────
    if (sub === 'list' || sub === 'ls') {
      const config = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')

      const allOpen = db.get(KEY.open(gid)) || {}
      const entries = Object.entries(allOpen)
      if (!entries.length) return message.reply('Aucun ticket ouvert.')

      const filter = message.mentions.members.first() || (args[1] ? message.guild.members.cache.get(args[1]) : null)
      const list   = filter ? entries.filter(([, t]) => t.userId === filter.id) : entries

      if (!list.length) return message.reply(`Aucun ticket ouvert pour **${filter.user.username}**.`)

      const lines = list.map(([cid, t]) => {
        const ch    = message.guild.channels.cache.get(cid)
        if (!ch) return null
        const prio  = PRIORITY[t.priority] || PRIORITY.normal
        const claim = t.claimedBy ? ` · ✋ <@${t.claimedBy}>` : ''
        const subj  = t.subject   ? ` · *${t.subject}*`        : ''
        return `${prio.emoji} \`#${String(t.num).padStart(4,'0')}\` <#${cid}> — <@${t.userId}>${subj}${claim}`
      }).filter(Boolean)

      const c = new ContainerBuilder().setAccentColor(0xE74C3C)
      c.addTextDisplayComponents(td => td.setContent(`## 🎫 Tickets ouverts (${lines.length})\n-# ${message.guild.name}`))
      c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      c.addTextDisplayComponents(td => td.setContent(lines.join('\n').slice(0, 3900) || 'Aucun salon trouvé.'))
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
    }

    // ── prio ──────────────────────────────────────────────────
    if (sub === 'prio' || sub === 'priority') {
      const ticketData = db.get(KEY.ch(message.channel.id))
      if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')
      const config = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')
      const level = args[1]?.toLowerCase()
      if (!level || !PRIORITY[level]) {
        return message.reply({ components: [buildPrioPanel(message.channel.id)], flags: MessageFlags.IsComponentsV2 })
      }
      ticketData.priority = level
      db.set(KEY.ch(message.channel.id), ticketData)
      const allOpen = db.get(KEY.open(gid)) || {}
      if (allOpen[message.channel.id]) { allOpen[message.channel.id].priority = level; db.set(KEY.open(gid), allOpen) }
      const p = PRIORITY[level]
      return message.reply(`${p.emoji} Priorité changée en **${p.label}**.`)
    }

    // ── stats ─────────────────────────────────────────────────
    if (sub === 'stats') {
      const config  = cfg(gid)
      const isStaff = config.staffRoleId
        ? message.member.roles.cache.has(config.staffRoleId)
        : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
      if (!isStaff) return message.reply('❌ Réservé au staff.')

      const allOpen   = db.get(KEY.open(gid)) || {}
      const allClosed = db.get(KEY.closed(gid)) || []
      const counter   = db.get(KEY.num(gid)) || 0

      const openList  = Object.values(allOpen)
      const claimed   = openList.filter(t => t.claimedBy).length
      const ratings   = allClosed.filter(t => t.rating).map(t => t.rating)
      const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A'

      const prioCount = {}
      for (const p of Object.keys(PRIORITY)) prioCount[p] = openList.filter(t => t.priority === p).length

      const c = new ContainerBuilder().setAccentColor(0xE74C3C)
      c.addTextDisplayComponents(td => td.setContent(`## 📊 Statistiques des tickets\n-# ${message.guild.name}`))
      c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      c.addTextDisplayComponents(td => td.setContent(
        `🎫 **Total créés** ${counter}\n` +
        `📂 **Ouverts** ${openList.length}  ·  ✋ **Pris en charge** ${claimed}\n` +
        `✅ **Fermés** ${allClosed.length}  ·  ⭐ **Note moy.** ${avgRating}\n\n` +
        `**Priorités en cours :**\n` +
        Object.entries(PRIORITY).map(([k, v]) => `${v.emoji} ${v.label} : **${prioCount[k]}**`).join('  ·  ')
      ))
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
    }

    // ── reset ─────────────────────────────────────────────────
    if (sub === 'reset') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
        return message.reply('❌ Réservé aux administrateurs.')
      resetCfg(gid)
      return message.reply('✅ Configuration des tickets réinitialisée. Les tickets ouverts ne sont pas affectés.')
    }

    // ── help / défaut ─────────────────────────────────────────
    const config = cfg(gid)
    const c = new ContainerBuilder().setAccentColor(0xE74C3C)
    c.addTextDisplayComponents(td => td.setContent(`## 🎫 Système de Tickets v3\n-# Aide — \`${prefix}ticket <sous-commande>\``))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(
      `**Général**\n` +
      `\`${prefix}ticket new [type]\` · Ouvrir un ticket\n` +
      `\`${prefix}ticket close [raison]\` · Fermer ce ticket\n` +
      `\`${prefix}ticket claim\` · Prendre en charge\n` +
      `\`${prefix}ticket prio <low|normal|high|urgent>\` · Priorité\n` +
      `\`${prefix}ticket add @user\` · Ajouter un membre\n` +
      `\`${prefix}ticket remove @user\` · Retirer un membre\n\n` +
      `**Staff**\n` +
      `\`${prefix}ticket list [@user]\` · Voir les tickets ouverts\n` +
      `\`${prefix}ticket stats\` · Statistiques\n\n` +
      `**Admin**\n` +
      `\`${prefix}ticket setup\` · Configurer le système\n` +
      `\`${prefix}ticket reset\` · Réinitialiser la config\n\n` +
      `-# Aliases : \`${prefix}t\`, \`${prefix}tkt\` · Système ${config.enabled !== false ? '🟢 Activé' : '🔴 Désactivé'}`
    ))
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
  },
}
