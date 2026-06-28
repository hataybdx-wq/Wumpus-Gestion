// ============================================================
//  utils/tickets.js  —  Système de tickets v3 (refait de 0)
//
//  Architecture totalement différente de l'ancien système :
//    • Clés DB préfixées  tkt:*  (ex-tickets_*)
//    • Priorités : low / normal / high / urgent
//    • Notation à la fermeture (1–5 étoiles)
//    • Auto-close après inactivité configurable
//    • Transcripts améliorés avec statistiques
//    • Un seul utilitaire pour tout le cycle de vie
//
//  Fonctions exportées :
//    cfg(gid)                                  → config ou {}
//    saveCfg(gid, data)
//    resetCfg(gid)
//    createTicket(client, guild, member, opts) → { ok, channel?, error? }
//    requestClose(channel, requester, reason)
//    confirmClose(client, guild, channel, closedBy, reason)
//    buildPanel(guild)                         → Components V2
//    buildSetupPanel(guild, userId)            → Components V2
//    nextNumber(gid)                           → int
//    PRIORITY                                  → constante
// ============================================================
'use strict'

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, AttachmentBuilder, MessageFlags,
} = require('discord.js')
const db   = require('quick.db')
const fs   = require('fs')
const path = require('path')

// ─── Constantes ───────────────────────────────────────────────
const PRIORITY = {
  low:    { label: 'Faible',  emoji: '🟢', color: 0x57F287 },
  normal: { label: 'Normal',  emoji: '🔵', color: 0x5865F2 },
  high:   { label: 'Élevée',  emoji: '🟠', color: 0xFEE75C },
  urgent: { label: 'Urgente', emoji: '🔴', color: 0xED4245 },
}

const ACCENT   = 0xE74C3C
const KEY = {
  cfg:  gid => `tkt:cfg:${gid}`,
  open: gid => `tkt:open:${gid}`,
  ch:   id  => `tkt:ch:${id}`,
  num:  gid => `tkt:num:${gid}`,
  closed: gid => `tkt:closed:${gid}`,
}

// ─── Config helpers ───────────────────────────────────────────
function cfg(gid)          { return db.get(KEY.cfg(gid)) || {} }
function saveCfg(gid, data){ db.set(KEY.cfg(gid), data) }
function resetCfg(gid) {
  db.delete(KEY.cfg(gid))
  // NE supprime PAS les tickets ouverts — on garde l'historique
}

// ─── Numéro auto-incrémenté ───────────────────────────────────
function nextNumber(gid) {
  const n = (db.get(KEY.num(gid)) || 0) + 1
  db.set(KEY.num(gid), n)
  return n
}

// ─── Créer un ticket ──────────────────────────────────────────
async function createTicket(client, guild, member, opts = {}) {
  const gid    = guild.id
  const config = cfg(gid)

  if (config.enabled === false)
    return { ok: false, error: 'Le système de tickets est désactivé.' }

  // Limite par membre
  const maxOpen = config.maxOpen ?? 1
  if (maxOpen > 0) {
    const allOpen  = db.get(KEY.open(gid)) || {}
    const userOpen = Object.values(allOpen).filter(t => t.userId === member.id).length
    if (userOpen >= maxOpen)
      return { ok: false, error: `Vous avez déjà **${userOpen}** ticket(s) ouvert(s). Maximum : **${maxOpen}**.` }
  }

  const num      = nextNumber(gid)
  const prio     = opts.priority || 'normal'
  const prioData = PRIORITY[prio] || PRIORITY.normal
  const label    = opts.typeLabel || 'Général'
  const slug     = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const chanName = `${slug}-${String(num).padStart(4, '0')}`

  // Permissions
  const overwrites = [
    { id: guild.roles.everyone,  deny:  [PermissionFlagsBits.ViewChannel] },
    { id: member.id,             allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ]},
    { id: guild.members.me.id,   allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
    ]},
  ]
  if (config.staffRoleId) {
    overwrites.push({ id: config.staffRoleId, allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ManageMessages,
    ]})
  }

  let channel
  try {
    channel = await guild.channels.create({
      name:   chanName,
      type:   ChannelType.GuildText,
      parent: config.categoryId || null,
      topic:  `🎫 #${num} | ${member.user.username} | ${prioData.emoji} ${prioData.label}${opts.subject ? ` | ${opts.subject}` : ''}`,
      permissionOverwrites: overwrites,
      reason: `Ticket #${num} — ${member.user.username}`,
    })
  } catch (err) {
    return { ok: false, error: `Impossible de créer le salon : ${err.message}` }
  }

  // Données du ticket
  const ticketData = {
    id:          channel.id,
    num,
    userId:      member.id,
    userTag:     member.user.username,
    typeId:      opts.typeId    || 'default',
    typeLabel:   label,
    priority:    prio,
    subject:     opts.subject   || null,
    details:     opts.details   || null,
    claimedBy:   null,
    claimedAt:   null,
    openedAt:    Date.now(),
    lastActivity: Date.now(),
    tags:        [],
    rating:      null,
  }

  db.set(KEY.ch(channel.id), ticketData)
  const allOpen = db.get(KEY.open(gid)) || {}
  allOpen[channel.id] = ticketData
  db.set(KEY.open(gid), allOpen)

  // Message d'ouverture
  const welcome = (config.openMessage || 'Bienvenue {user} ! Décrivez votre demande, le staff vous répondra dès que possible.')
    .replace('{user}',   `<@${member.id}>`)
    .replace('{type}',   label)
    .replace('{server}', guild.name)

  const ts     = Math.floor(Date.now() / 1000)
  const accent = prioData.color

  const c = new ContainerBuilder().setAccentColor(accent)
  c.addTextDisplayComponents(td => td.setContent(
    `## 🎫 Ticket \`#${String(num).padStart(4, '0')}\`\n` +
    `-# ${guild.name} · ${prioData.emoji} Priorité ${prioData.label}`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(welcome))
  c.addSeparatorComponents(s => s.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  const infoLines = [
    `👤 **Membre** <@${member.id}>`,
    `🏷️ **Type** ${label}`,
    `${prioData.emoji} **Priorité** ${prioData.label}`,
    `📅 **Ouvert** <t:${ts}:R>`,
  ]
  if (opts.subject) infoLines.push(`📌 **Sujet** ${opts.subject}`)
  if (opts.details) infoLines.push(`📝 **Détails** ${opts.details}`)
  c.addTextDisplayComponents(td => td.setContent(infoLines.join('\n')))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`tkt:close:${channel.id}`)
      .setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`tkt:claim:${channel.id}`)
      .setLabel('Prendre en charge').setEmoji('✋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:prio:${channel.id}`)
      .setLabel('Priorité').setEmoji('🎚️').setStyle(ButtonStyle.Secondary),
  ))

  let ping = `<@${member.id}>`
  if (config.mention && config.staffRoleId) ping = `<@&${config.staffRoleId}> ${ping}`

  try {
    await channel.send({ content: ping.trim(), components: [c], flags: MessageFlags.IsComponentsV2 })
  } catch (err) {
    await channel.delete().catch(() => {})
    const clean = db.get(KEY.open(gid)) || {}
    delete clean[channel.id]
    db.set(KEY.open(gid), clean)
    db.delete(KEY.ch(channel.id))
    return { ok: false, error: `Impossible d'envoyer le message : ${err.message}` }
  }

  _log(guild, config, 'open', ticketData, member, channel)
  return { ok: true, channel, ticket: ticketData }
}

// ─── Demande de fermeture (avec confirmation + notation) ──────
async function requestClose(channel, requester, reason = 'Aucune raison') {
  const c = new ContainerBuilder().setAccentColor(0xF39C12)
  c.addTextDisplayComponents(td => td.setContent(
    `## ⚠️ Fermeture demandée\n` +
    `🔒 **Par** <@${requester.id}>\n` +
    `📝 **Raison** ${reason}\n` +
    `-# Notez ce ticket avant la fermeture (optionnel)`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`tkt:rate:${channel.id}:1`).setLabel('⭐').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tkt:rate:${channel.id}:2`).setLabel('⭐⭐').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tkt:rate:${channel.id}:3`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tkt:rate:${channel.id}:4`).setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary),
  ))
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`tkt:rate:${channel.id}:5`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:confirm-close:${channel.id}:${encodeURIComponent(reason)}`)
      .setLabel('Fermer maintenant').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  ))

  await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
}

// ─── Confirmer et exécuter la fermeture ───────────────────────
async function confirmClose(client, guild, channel, closedBy, reason = 'Aucune raison') {
  const gid        = guild.id
  const ticketData = db.get(KEY.ch(channel.id))
  if (!ticketData) return

  const config = cfg(gid)

  // Message de fermeture
  const c = new ContainerBuilder().setAccentColor(0xED4245)
  c.addTextDisplayComponents(td => td.setContent(
    `## 🔒 Ticket fermé\n` +
    `-# Suppression dans 5 secondes`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(
    `🔒 **Fermé par** <@${closedBy.id}>\n` +
    `📝 **Raison** ${reason}` +
    (ticketData.rating ? `\n⭐ **Note** ${'⭐'.repeat(ticketData.rating)} (${ticketData.rating}/5)` : '')
  ))
  await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {})

  // Transcript
  let file = null
  if (config.transcript !== false)
    file = await _buildTranscript(channel, guild, ticketData, closedBy, reason)

  await _log(guild, config, 'close', ticketData, closedBy, channel, reason, file)

  // DM au créateur
  try {
    const owner = await guild.members.fetch(ticketData.userId)
    const dm = new ContainerBuilder().setAccentColor(0xED4245)
    dm.addTextDisplayComponents(td => td.setContent(
      `## 🔒 Ticket \`#${String(ticketData.num).padStart(4, '0')}\` fermé\n` +
      `🏠 **Serveur** ${guild.name}\n` +
      `🔒 **Fermé par** ${closedBy.user.username}\n` +
      `📝 **Raison** ${reason}` +
      (ticketData.rating ? `\n⭐ **Votre note** ${'⭐'.repeat(ticketData.rating)}/5` : '') +
      (ticketData.subject ? `\n📌 **Sujet** ${ticketData.subject}` : '')
    ))
    const dmPayload = { components: [dm], flags: MessageFlags.IsComponentsV2 }
    if (file) dmPayload.files = [file]
    await owner.send(dmPayload)
  } catch {}

  // Nettoyage DB
  const allOpen = db.get(KEY.open(gid)) || {}
  delete allOpen[channel.id]
  db.set(KEY.open(gid), allOpen)

  const history = db.get(KEY.closed(gid)) || []
  history.push({
    ...ticketData,
    closedAt: Date.now(),
    closedBy: closedBy.id,
    closedByTag: closedBy.user.username,
    reason,
  })
  // Garder les 500 derniers
  if (history.length > 500) history.splice(0, history.length - 500)
  db.set(KEY.closed(gid), history)
  db.delete(KEY.ch(channel.id))

  setTimeout(() => channel.delete(`Ticket #${ticketData.num} fermé par ${closedBy.user.username}`).catch(() => {}), 5000)
}

// ─── Construire le panneau public ─────────────────────────────
function buildPanel(guild, config) {
  if (!config) config = cfg(guild.id)
  const types = config.types || []

  const c = new ContainerBuilder().setAccentColor(ACCENT)
  c.addTextDisplayComponents(td => td.setContent(
    `## ${config.panelTitle || '🎫 Support — Ouvrir un ticket'}\n-# ${guild.name}`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(
    config.panelDesc ||
    'Besoin d\'aide ou une question ?\nSélectionnez le type de ticket ci-dessous ou cliquez sur **Ouvrir**.'
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

  if (types.length === 0) {
    c.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder()
        .setCustomId('tkt:open:default')
        .setLabel('Ouvrir un ticket').setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    ))
  } else if (types.length <= 3) {
    c.addActionRowComponents(row => row.setComponents(
      ...types.map(t =>
        new ButtonBuilder()
          .setCustomId(`tkt:open:${t.id}`)
          .setLabel(t.label)
          .setEmoji(t.emoji || '🎫')
          .setStyle(ButtonStyle.Primary)
      )
    ))
  } else {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tkt:select-type')
        .setPlaceholder('🎫 Choisissez le type de ticket…')
        .addOptions(
          types.slice(0, 25).map(t =>
            new StringSelectMenuOptionBuilder()
              .setLabel(t.label)
              .setValue(t.id)
              .setDescription(t.description || `Ouvrir un ticket ${t.label}`)
              .setEmoji(t.emoji || '🎫')
          )
        )
    ))
  }

  c.addTextDisplayComponents(td => td.setContent(
    `-# ${config.panelFooter || 'Notre équipe vous répondra dès que possible.'}`
  ))
  return c
}

// ─── Panel de configuration (setup interactif) ────────────────
function buildSetupPanel(guild, userId) {
  const gid    = guild.id
  const config = cfg(gid)
  const c      = new ContainerBuilder().setAccentColor(ACCENT)
  const on     = config.enabled !== false

  c.addTextDisplayComponents(td => td.setContent(
    `## ⚙️ Configuration Tickets v3\n` +
    `### ${on ? '🟢 Activé' : '🔴 Désactivé'}\n` +
    `-# Nouveau système — clés DB préfixées \`tkt:*\``
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Statut de la config
  const hasAll = config.categoryId && config.staffRoleId && config.panelChannelId
  if (!hasAll) {
    c.addTextDisplayComponents(td => td.setContent(
      `### ⚡ Setup Express\n-# Génère automatiquement catégorie · staff · panel · logs`
    ))
    c.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder()
        .setCustomId(`tkt:setup:auto:${userId}`)
        .setLabel('Setup Express').setEmoji('⚡')
        .setStyle(ButtonStyle.Success)
    ))
    c.addSeparatorComponents(s => s.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    c.addTextDisplayComponents(td => td.setContent(`-# ─── ou configurez manuellement ───`))
    c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  }

  // Résumé
  c.addTextDisplayComponents(td => td.setContent(
    `### 📌 Paramètres actuels\n` +
    `📁 **Catégorie** ${config.categoryId ? `<#${config.categoryId}>` : '`—`'}\n` +
    `👮 **Staff** ${config.staffRoleId ? `<@&${config.staffRoleId}>` : '`—`'}\n` +
    `📺 **Panneau** ${config.panelChannelId ? `<#${config.panelChannelId}>` : '`—`'}\n` +
    `📋 **Logs** ${config.logsChannelId ? `<#${config.logsChannelId}>` : '`—`'}\n` +
    `🔢 **Max / membre** ${config.maxOpen ?? 1}\n` +
    `🎚️ **Types** ${(config.types || []).length} défini(s)\n` +
    `📄 **Transcript** ${config.transcript !== false ? '✅' : '❌'} · ` +
    `🔔 **Mention** ${config.mention !== false ? '✅' : '❌'} · ` +
    `⏱️ **Auto-close** ${config.autoClose ? config.autoClose + 'h' : '❌'}`
  ))

  // Sélecteurs catégorie / role / channel
  const cats  = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory)
  const roles = guild.roles.cache.filter(r => !r.managed && r.id !== guild.id)
  const texts = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText)

  if (cats.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`tkt:setup:cat:${userId}`)
        .setPlaceholder('📁 Catégorie des tickets')
        .addOptions(cats.map(ch =>
          new StringSelectMenuOptionBuilder().setLabel(ch.name).setValue(ch.id).setDefault(ch.id === config.categoryId)
        ).slice(0, 25))
    ))
  }
  if (roles.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`tkt:setup:staff:${userId}`)
        .setPlaceholder('👮 Rôle staff')
        .addOptions(roles.map(r =>
          new StringSelectMenuOptionBuilder().setLabel(r.name).setValue(r.id).setDefault(r.id === config.staffRoleId)
        ).slice(0, 25))
    ))
  }
  if (texts.size > 0) {
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`tkt:setup:panel:${userId}`)
        .setPlaceholder('📺 Salon du panneau')
        .addOptions(texts.map(ch =>
          new StringSelectMenuOptionBuilder().setLabel(`#${ch.name}`).setValue(ch.id).setDefault(ch.id === config.panelChannelId)
        ).slice(0, 25))
    ))
    c.addActionRowComponents(row => row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`tkt:setup:logs:${userId}`)
        .setPlaceholder('📋 Salon des logs')
        .addOptions(texts.map(ch =>
          new StringSelectMenuOptionBuilder().setLabel(`#${ch.name}`).setValue(ch.id).setDefault(ch.id === config.logsChannelId)
        ).slice(0, 25))
    ))
  }

  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Boutons options
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`tkt:setup:transcript:${userId}`)
      .setLabel('Transcript').setEmoji('📄')
      .setStyle(config.transcript !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:mention:${userId}`)
      .setLabel('Mention staff').setEmoji('🔔')
      .setStyle(config.mention !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:maxopen:${userId}`)
      .setLabel('Max tickets').setEmoji('🔢')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:autoclose:${userId}`)
      .setLabel('Auto-close').setEmoji('⏱️')
      .setStyle(config.autoClose ? ButtonStyle.Success : ButtonStyle.Secondary),
  ))

  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`tkt:setup:welcome:${userId}`)
      .setLabel('Message accueil').setEmoji('💬')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:title:${userId}`)
      .setLabel('Titre panneau').setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:addtype:${userId}`)
      .setLabel('Ajouter un type').setEmoji('➕')
      .setStyle(ButtonStyle.Secondary),
  ))

  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`tkt:setup:toggle:${userId}`)
      .setLabel(on ? 'Désactiver' : 'Activer')
      .setStyle(on ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:send:${userId}`)
      .setLabel('Publier le panneau').setEmoji('📤')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!config.panelChannelId),
    new ButtonBuilder()
      .setCustomId(`tkt:setup:reset:${userId}`)
      .setLabel('Réinitialiser config').setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
  ))
  c.addTextDisplayComponents(td => td.setContent(
    `-# Sauvegarde automatique · DB: \`tkt:cfg:${guild.id}\``
  ))
  return c
}

// ─── Modal d'ouverture ────────────────────────────────────────
function buildOpenModal(typeId, typeLabel) {
  return new ModalBuilder()
    .setCustomId(`tkt:modal:${typeId || 'default'}`)
    .setTitle(typeLabel ? `Ticket — ${typeLabel}` : 'Ouvrir un ticket')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('subject')
          .setLabel('Sujet de votre demande')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex : Problème de rôle, question sur le serveur…')
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('details')
          .setLabel('Détails (optionnel)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Donnez autant de détails que possible…')
          .setMaxLength(1000)
          .setRequired(false)
      )
    )
}

// ─── Modal priorité ───────────────────────────────────────────
function buildPrioPanel(channelId) {
  const c = new ContainerBuilder().setAccentColor(ACCENT)
  c.addTextDisplayComponents(td => td.setContent(
    `## 🎚️ Changer la priorité`
  ))
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`tkt:set-prio:${channelId}:low`).setLabel('🟢 Faible').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tkt:set-prio:${channelId}:normal`).setLabel('🔵 Normal').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tkt:set-prio:${channelId}:high`).setLabel('🟠 Élevée').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tkt:set-prio:${channelId}:urgent`).setLabel('🔴 Urgente').setStyle(ButtonStyle.Danger),
  ))
  return c
}

// ─── Log ─────────────────────────────────────────────────────
async function _log(guild, config, action, ticketData, member, channel, reason, file) {
  if (!config.logsChannelId) return
  const logCh = guild.channels.cache.get(config.logsChannelId)
  if (!logCh) return

  const isOpen = action === 'open'
  const prio   = PRIORITY[ticketData.priority] || PRIORITY.normal
  const ts     = Math.floor(Date.now() / 1000)

  const c = new ContainerBuilder().setAccentColor(isOpen ? 0x2ECC71 : 0xED4245)
  c.addTextDisplayComponents(td => td.setContent(
    `## ${isOpen ? '📥 Ticket ouvert' : '📤 Ticket fermé'}\n` +
    `🎫 \`#${String(ticketData.num).padStart(4, '0')}\` · 🏷️ ${ticketData.typeLabel} · <#${channel.id}>\n` +
    `${isOpen ? '👤 **Ouvert par**' : '🔒 **Fermé par**'} <@${member.id}>\n` +
    `${prio.emoji} **Priorité** ${prio.label} · 📅 <t:${ts}:f>` +
    (ticketData.subject ? `\n📌 **Sujet** ${ticketData.subject}` : '') +
    (reason && !isOpen  ? `\n📝 **Raison** ${reason}`           : '') +
    (ticketData.rating  ? `\n⭐ **Note** ${ticketData.rating}/5` : '')
  ))

  const payload = { components: [c], flags: MessageFlags.IsComponentsV2 }
  if (file) payload.files = [file]
  logCh.send(payload).catch(() => {})
}

// ─── Transcript HTML ──────────────────────────────────────────
async function _buildTranscript(channel, guild, ticketData, closedBy, reason) {
  try {
    const msgs = []
    let lastId = null
    for (;;) {
      const opts  = { limit: 100 }
      if (lastId) opts.before = lastId
      const batch = await channel.messages.fetch(opts)
      if (!batch.size) break
      msgs.push(...batch.values())
      lastId = batch.last()?.id
      if (batch.size < 100) break
    }
    msgs.reverse()

    const prio     = PRIORITY[ticketData.priority] || PRIORITY.normal
    const openedAt = new Date(ticketData.openedAt).toLocaleString('fr-FR')
    const closedAt = new Date().toLocaleString('fr-FR')
    const num      = String(ticketData.num).padStart(4, '0')
    const duration = _formatDuration(Date.now() - ticketData.openedAt)

    const rows = msgs.map(m => {
      const time   = new Date(m.createdTimestamp).toLocaleString('fr-FR')
      const avatar = m.author.displayAvatarURL({ size: 32, extension: 'webp' })
      const badge  = m.author.bot ? '<span class="bot">BOT</span>' : ''
      let content  = _esc(m.content || '')
      m.embeds.forEach(e => {
        content += `<div class="embed"><b>${_esc(e.title || '')}</b><p>${_esc(e.description || '')}</p></div>`
      })
      m.attachments.forEach(a => {
        content += a.contentType?.startsWith('image/')
          ? `<br><img class="img" src="${a.url}">`
          : `<br><a href="${a.url}">${_esc(a.name)}</a>`
      })
      return `<div class="msg"><img class="av" src="${avatar}"><div class="body">` +
        `<span class="name">${_esc(m.author.username)}${badge}</span>` +
        `<span class="time">${time}</span>` +
        `<div class="text">${content || '<em>—</em>'}</div></div></div>`
    }).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Transcript #${num} — ${_esc(guild.name)}</title>
<style>
:root{--bg:#0f1117;--s1:#1a1d27;--s2:#22263a;--t:#e2e4ed;--m:#8b8fa8;--r:#E74C3C;--g:#2ECC71}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);min-height:100vh}
.header{background:linear-gradient(135deg,#1a1d27,#22263a);padding:28px 36px;border-bottom:3px solid var(--r);display:flex;align-items:center;gap:20px}
.header .ico{font-size:2.5rem;background:var(--r);width:58px;height:58px;border-radius:14px;display:grid;place-items:center;flex-shrink:0}
.header h1{font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:-.3px}
.header p{font-size:.82rem;color:var(--m);margin-top:4px}
.meta{background:var(--s1);padding:14px 36px;display:flex;gap:28px;flex-wrap:wrap;border-bottom:1px solid #252836}
.mi{font-size:.78rem}.mi strong{color:#fff;display:block;font-weight:600;margin-bottom:2px}.mi span{color:var(--m)}
.subject{background:rgba(231,76,60,.1);border-left:4px solid var(--r);padding:12px 36px;font-size:.85rem;line-height:1.6}
.subject strong{color:#fff}
.stats{background:var(--s2);padding:10px 36px;display:flex;gap:24px;font-size:.78rem;color:var(--m)}
.stats span{display:flex;align-items:center;gap:5px}.stats b{color:#fff}
.msgs{padding:16px 36px;max-width:980px;margin:0 auto}
.msg{display:flex;gap:14px;padding:8px 0;border-bottom:1px solid #1c1f2e}
.av{width:36px;height:36px;border-radius:50%;flex-shrink:0;margin-top:2px}
.body{flex:1;min-width:0}.name{font-weight:700;color:#fff;font-size:.88rem}.bot{background:var(--r);color:#fff;font-size:.62rem;padding:1px 5px;border-radius:4px;font-weight:700;text-transform:uppercase;margin-left:5px;vertical-align:middle}
.time{color:var(--m);font-size:.72rem;margin-left:8px}
.text{color:var(--t);font-size:.86rem;line-height:1.55;margin-top:4px;word-break:break-word}
.embed{border-left:3px solid var(--r);background:var(--s2);padding:8px 12px;border-radius:0 6px 6px 0;margin-top:6px}
.img{max-width:260px;max-height:160px;border-radius:8px;margin-top:6px;display:block}
.prio-${ticketData.priority}{color:${_prioHex(ticketData.priority)}}
footer{text-align:center;padding:24px;color:var(--m);font-size:.75rem;border-top:1px solid #1c1f2e;margin-top:24px}
a{color:var(--r)}
</style></head><body>
<div class="header"><div class="ico">🎫</div><div>
<h1>Transcript — Ticket <code>#${num}</code></h1>
<p>${_esc(guild.name)} · #${_esc(channel.name)}</p></div></div>
<div class="meta">
<div class="mi"><strong>Type</strong><span>${_esc(ticketData.typeLabel || 'Général')}</span></div>
<div class="mi"><strong>Créé par</strong><span>@${_esc(ticketData.userTag)}</span></div>
<div class="mi"><strong>Priorité</strong><span class="prio-${ticketData.priority}">${prio.emoji} ${prio.label}</span></div>
<div class="mi"><strong>Ouvert le</strong><span>${openedAt}</span></div>
<div class="mi"><strong>Fermé le</strong><span>${closedAt}</span></div>
<div class="mi"><strong>Fermé par</strong><span>${_esc(closedBy.user.username)}</span></div>
<div class="mi"><strong>Raison</strong><span>${_esc(reason)}</span></div>
${ticketData.rating ? `<div class="mi"><strong>Note</strong><span>${'⭐'.repeat(ticketData.rating)} ${ticketData.rating}/5</span></div>` : ''}
</div>
<div class="stats">
<span>💬 <b>${msgs.length}</b> messages</span>
<span>⏱️ <b>${duration}</b> ouvert</span>
${ticketData.claimedBy ? `<span>✋ <b>Pris en charge</b></span>` : ''}
</div>
${ticketData.subject ? `<div class="subject"><strong>📌 Sujet :</strong> ${_esc(ticketData.subject)}${ticketData.details ? `<br><strong>📝 Détails :</strong> ${_esc(ticketData.details)}` : ''}</div>` : ''}
<div class="msgs">${rows}</div>
<footer>CrowBot Tickets v3 · Transcript généré le ${closedAt}</footer>
</body></html>`

    const dir      = path.join(__dirname, '..', 'system', 'transcripts')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filename = `tkt-${num}-${guild.id}-${Date.now()}.html`
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, html, 'utf8')
    return new AttachmentBuilder(filepath, { name: filename })
  } catch (err) {
    console.error('[TKT] Transcript error:', err.message)
    return null
  }
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}
function _prioHex(p) {
  return { low:'#57F287', normal:'#5865F2', high:'#FEE75C', urgent:'#ED4245' }[p] || '#fff'
}
function _formatDuration(ms) {
  const s = Math.floor(ms / 1000)
  if (s < 60)   return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h${String(m % 60).padStart(2,'0')}`
  return `${Math.floor(h / 24)}j ${h % 24}h`
}

module.exports = {
  PRIORITY, KEY,
  cfg, saveCfg, resetCfg,
  nextNumber,
  createTicket, requestClose, confirmClose,
  buildPanel, buildSetupPanel, buildOpenModal, buildPrioPanel,
}
