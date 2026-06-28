// ============================================================
//  utils/ticketUtils.js — Système de tickets (refait de 0)
//
//  Fonctions exportées :
//    buildTicketModal(typeId, typeLabel)
//    openTicket(client, guild, member, typeData, cfg, subject, desc)
//    closeTicket(client, guild, channel, ticketData, cfg, closedBy, reason)
//    buildTranscript(channel, guild, ticketData, closedBy, reason)
//    sendTicketLog(guild, cfg, action, ticketData, member, channel, reason, file)
// ============================================================
'use strict'

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, AttachmentBuilder, MessageFlags,
} = require('discord.js')
const db   = require('quick.db')
const path = require('path')
const fs   = require('fs')

const C_RED   = 0xFF0000
const C_GREEN = 0x2ECC71
const C_CLOSE = 0xED4245

// ─────────────────────────────────────────────────────────────
//  Numéro auto-incrémenté par serveur
// ─────────────────────────────────────────────────────────────
function nextTicketNumber(gid) {
  const n = (db.get(`ticket_counter_${gid}`) || 0) + 1
  db.set(`ticket_counter_${gid}`, n)
  return n
}

// ─────────────────────────────────────────────────────────────
//  Modal de création (sujet + description)
// ─────────────────────────────────────────────────────────────
function buildTicketModal(typeId, typeLabel) {
  return new ModalBuilder()
    .setCustomId(`ticket_modal_${typeId || 'default'}`)
    .setTitle(typeLabel ? `Ticket — ${typeLabel}` : 'Ouvrir un ticket')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticket_subject')
          .setLabel('Sujet')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Résumez votre demande en quelques mots…')
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticket_description')
          .setLabel('Description (optionnel)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Donnez plus de détails si nécessaire…')
          .setMaxLength(1000)
          .setRequired(false)
      )
    )
}

// ─────────────────────────────────────────────────────────────
//  Ouvrir un ticket (appelé après soumission du modal)
// ─────────────────────────────────────────────────────────────
async function openTicket(client, guild, member, typeData, cfg, subject, description) {
  const gid = guild.id

  // Vérifier la limite de tickets ouverts par membre
  if (cfg.maxOpen && cfg.maxOpen > 0) {
    const allOpen  = db.get(`tickets_open_${gid}`) || {}
    const userOpen = Object.values(allOpen).filter(t => t.ownerId === member.id).length
    if (userOpen >= cfg.maxOpen)
      return { error: `Vous avez déjà **${userOpen}** ticket(s) ouvert(s). Maximum autorisé : **${cfg.maxOpen}**.` }
  }

  const num      = nextTicketNumber(gid)
  const typeName = typeData?.label?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'ticket'
  const chanName = `${typeName}-${String(num).padStart(4, '0')}`

  // Permissions du salon
  const overwrites = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ]},
  ]
  if (guild.members.me) {
    overwrites.push({ id: guild.members.me.id, allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
    ]})
  }
  if (cfg.staffRoleId) {
    overwrites.push({ id: cfg.staffRoleId, allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ManageMessages,
    ]})
  }

  // Créer le salon
  let channel
  try {
    channel = await guild.channels.create({
      name:   chanName,
      type:   ChannelType.GuildText,
      parent: cfg.categoryId || null,
      topic:  `#${num} · ${member.user.username}${subject ? ` · ${subject}` : ''}`,
      permissionOverwrites: overwrites,
      reason: `Ticket #${num} — ${member.user.username}`,
    })
  } catch (err) {
    return { error: `Impossible de créer le salon : ${err.message}` }
  }

  // Données du ticket
  const ticketData = {
    channelId:   channel.id,
    ownerId:     member.id,
    ownerTag:    member.user.username,
    type:        typeData?.label  || 'Général',
    typeId:      typeData?.id     || 'default',
    number:      num,
    subject:     subject          || null,
    description: description      || null,
    openedAt:    Date.now(),
    claimedBy:   null,
  }
  db.set(`ticket_channel_${channel.id}`, ticketData)
  const allOpen = db.get(`tickets_open_${gid}`) || {}
  allOpen[channel.id] = ticketData
  db.set(`tickets_open_${gid}`, allOpen)

  // Message de bienvenue
  const welcomeMsg = (cfg.openMessage || 'Bienvenue {user} ! Notre équipe vous répondra dès que possible.')
    .replace('{user}',   `<@${member.id}>`)
    .replace('{type}',   typeData?.label || 'Général')
    .replace('{server}', guild.name)

  const ts = Math.floor(Date.now() / 1000)
  const c  = new ContainerBuilder().setAccentColor(C_RED)

  c.addTextDisplayComponents(td => td.setContent(
    `## 🎫 Ticket #${String(num).padStart(4, '0')} — ${typeData?.label || 'Général'}\n-# ${guild.name}`
  ))
  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addTextDisplayComponents(td => td.setContent(welcomeMsg))
  c.addSeparatorComponents(s => s.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  let info = `👤 **Créé par** <@${member.id}>\n🏷️ **Type** ${typeData?.label || 'Général'}\n📅 **Ouvert le** <t:${ts}:f>`
  if (subject)     info += `\n📌 **Sujet** ${subject}`
  if (description) info += `\n📝 **Détails** ${description}`
  c.addTextDisplayComponents(td => td.setContent(info))

  c.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  c.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${channel.id}`)
      .setLabel('Fermer le ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ticket_claim_${channel.id}`)
      .setLabel('Prendre en charge').setEmoji('✋').setStyle(ButtonStyle.Secondary),
  ))

  let ping = ''
  if (cfg.mention && cfg.staffRoleId) ping += `<@&${cfg.staffRoleId}> `
  ping += `<@${member.id}>`

  try {
    await channel.send({ content: ping.trim(), components: [c], flags: MessageFlags.IsComponentsV2 })
  } catch (err) {
    // Rollback si envoi impossible
    await channel.delete().catch(() => {})
    const clean = db.get(`tickets_open_${gid}`) || {}
    delete clean[channel.id]
    db.set(`tickets_open_${gid}`, clean)
    db.delete(`ticket_channel_${channel.id}`)
    return { error: `Impossible d'envoyer le message : ${err.message}` }
  }

  await sendTicketLog(guild, cfg, 'open', ticketData, member, channel)
  return { channel, ticketData }
}

// ─────────────────────────────────────────────────────────────
//  Fermer un ticket
// ─────────────────────────────────────────────────────────────
async function closeTicket(client, guild, channel, ticketData, cfg, closedBy, reason) {
  const gid = guild.id

  const cClose = new ContainerBuilder().setAccentColor(C_CLOSE)
  cClose.addTextDisplayComponents(td => td.setContent(
    `## 🔒 Ticket fermé\n-# Suppression dans 5 secondes`
  ))
  cClose.addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
  cClose.addTextDisplayComponents(td => td.setContent(
    `🔒 **Fermé par** <@${closedBy.id}>\n📝 **Raison** ${reason}`
  ))
  await channel.send({ components: [cClose], flags: MessageFlags.IsComponentsV2 }).catch(() => {})

  // Transcript HTML
  let transcriptFile = null
  if (cfg.transcript !== false)
    transcriptFile = await buildTranscript(channel, guild, ticketData, closedBy, reason)

  await sendTicketLog(guild, cfg, 'close', ticketData, closedBy, channel, reason, transcriptFile)

  // DM au créateur
  if (transcriptFile) {
    try {
      const owner = await guild.members.fetch(ticketData.ownerId)
      const dmC = new ContainerBuilder().setAccentColor(C_CLOSE)
      dmC.addTextDisplayComponents(td => td.setContent(
        `## 🔒 Ticket #${String(ticketData.number).padStart(4, '0')} fermé\n` +
        `🏠 **Serveur** ${guild.name}\n` +
        `🔒 **Fermé par** ${closedBy.user.username}\n` +
        `📝 **Raison** ${reason}` +
        (ticketData.subject ? `\n📌 **Sujet** ${ticketData.subject}` : '')
      ))
      await owner.send({ components: [dmC], flags: MessageFlags.IsComponentsV2, files: [transcriptFile] })
    } catch {}
  }

  // Nettoyage DB
  const allOpen = db.get(`tickets_open_${gid}`) || {}
  delete allOpen[channel.id]
  db.set(`tickets_open_${gid}`, allOpen)

  const closed = db.get(`tickets_closed_${gid}`) || []
  closed.push({ ...ticketData, closedAt: Date.now(), closedBy: closedBy.id, reason })
  db.set(`tickets_closed_${gid}`, closed)
  db.delete(`ticket_channel_${channel.id}`)

  setTimeout(() => channel.delete(`Ticket fermé par ${closedBy.user.username}`).catch(() => {}), 5000)
}

// ─────────────────────────────────────────────────────────────
//  Log dans le salon configuré
// ─────────────────────────────────────────────────────────────
async function sendTicketLog(guild, cfg, action, ticketData, member, channel, reason, transcriptFile) {
  if (!cfg.logsChannelId) return
  const logChannel = guild.channels.cache.get(cfg.logsChannelId)
  if (!logChannel) return

  const isOpen = action === 'open'
  const ts     = Math.floor(Date.now() / 1000)

  const c = new ContainerBuilder().setAccentColor(isOpen ? C_GREEN : C_CLOSE)
  c.addTextDisplayComponents(td => td.setContent(
    `## ${isOpen ? '📥 Ticket ouvert' : '📤 Ticket fermé'}\n` +
    `🔢 **#${String(ticketData.number).padStart(4, '0')}** · 🏷️ ${ticketData.type || 'Général'} · <#${channel.id}>\n` +
    `${isOpen ? '👤' : '🔒'} **${isOpen ? 'Ouvert' : 'Fermé'} par** <@${member.id}>\n📅 <t:${ts}:f>` +
    (ticketData.subject ? `\n📌 **Sujet** ${ticketData.subject}` : '') +
    (reason && !isOpen  ? `\n📝 **Raison** ${reason}`           : '')
  ))

  const payload = { components: [c], flags: MessageFlags.IsComponentsV2 }
  if (transcriptFile) payload.files = [transcriptFile]
  logChannel.send(payload).catch(() => {})
}

// ─────────────────────────────────────────────────────────────
//  Transcript HTML
// ─────────────────────────────────────────────────────────────
async function buildTranscript(channel, guild, ticketData, closedBy, reason) {
  try {
    const messages = []
    let lastId = null
    while (true) {
      const opts = { limit: 100 }
      if (lastId) opts.before = lastId
      const batch = await channel.messages.fetch(opts)
      if (batch.size === 0) break
      messages.push(...batch.values())
      lastId = batch.last()?.id
      if (batch.size < 100) break
    }
    messages.reverse()

    const rows = messages.map(m => {
      const time   = new Date(m.createdTimestamp).toLocaleString('fr-FR')
      const avatar = m.author.displayAvatarURL({ size: 32, extension: 'webp' })
      const badge  = m.author.bot ? ' <span class="badge">BOT</span>' : ''
      let content  = escapeHtml(m.content || '')
      if (m.embeds.length)
        content += m.embeds.map(e =>
          `<div class="embed"><strong>${escapeHtml(e.title||'')}</strong><p>${escapeHtml(e.description||'')}</p></div>`
        ).join('')
      if (m.attachments.size)
        content += [...m.attachments.values()].map(a =>
          a.contentType?.startsWith('image/')
            ? `<br><img class="attachment" src="${a.url}">`
            : `<br><a href="${a.url}">${escapeHtml(a.name)}</a>`
        ).join('')
      return `<div class="msg"><img class="avatar" src="${avatar}"><div class="body"><span class="name">${escapeHtml(m.author.username)}${badge}</span><span class="time">${time}</span><div class="content">${content || '<em>—</em>'}</div></div></div>`
    }).join('\n')

    const openedAt = new Date(ticketData.openedAt).toLocaleString('fr-FR')
    const closedAt = new Date().toLocaleString('fr-FR')
    const num      = String(ticketData.number).padStart(4, '0')

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Transcript Ticket #${num} — ${escapeHtml(guild.name)}</title>
<style>
:root{--bg:#1e1f22;--bg2:#2b2d31;--bg3:#313338;--text:#dcddde;--muted:#949ba4;--accent:#ff4444}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'gg sans','Noto Sans',sans-serif;background:var(--bg);color:var(--text)}
header{background:var(--bg2);padding:20px 32px;border-bottom:2px solid var(--accent);display:flex;align-items:center;gap:16px}
header .icon{font-size:2rem}header h1{font-size:1.15rem;font-weight:700;color:#fff}header p{font-size:.8rem;color:var(--muted);margin-top:2px}
.meta{background:var(--bg3);padding:12px 32px;display:flex;gap:24px;flex-wrap:wrap;border-bottom:1px solid #1a1b1e}
.meta-item{font-size:.8rem}.meta-item strong{color:var(--text);display:block;margin-bottom:1px}.meta-item span{color:var(--muted)}
.subject-bar{background:#ff444422;border-left:3px solid var(--accent);padding:10px 32px;font-size:.87rem}.subject-bar strong{color:#fff}
.messages{padding:12px 32px;max-width:960px;margin:0 auto}
.msg{display:flex;gap:12px;padding:6px 0;border-bottom:1px solid #25262a}
.avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;margin-top:3px}
.body{flex:1;min-width:0}.name{font-weight:600;color:#fff;font-size:.9rem}.time{color:var(--muted);font-size:.73rem;margin-left:8px}
.content{color:var(--text);font-size:.88rem;line-height:1.5;margin-top:3px;word-break:break-word}
.badge{background:var(--accent);color:#fff;font-size:.62rem;padding:1px 5px;border-radius:4px;font-weight:700;text-transform:uppercase;vertical-align:middle;margin-left:4px}
.embed{border-left:3px solid var(--accent);background:var(--bg2);padding:7px 10px;border-radius:0 4px 4px 0;margin-top:5px}
.attachment{max-width:280px;max-height:180px;border-radius:8px;margin-top:5px}
footer{text-align:center;padding:20px;color:var(--muted);font-size:.78rem;border-top:1px solid #1a1b1e;margin-top:20px}
a{color:var(--accent)}
</style></head><body>
<header><div class="icon">🎫</div><div><h1>Transcript — Ticket #${num}</h1><p>${escapeHtml(guild.name)} · ${escapeHtml(channel.name)}</p></div></header>
<div class="meta">
<div class="meta-item"><strong>Type</strong><span>${escapeHtml(ticketData.type||'Général')}</span></div>
<div class="meta-item"><strong>Créé par</strong><span>@${escapeHtml(ticketData.ownerTag||ticketData.ownerId)}</span></div>
<div class="meta-item"><strong>Ouvert le</strong><span>${openedAt}</span></div>
<div class="meta-item"><strong>Fermé le</strong><span>${closedAt}</span></div>
<div class="meta-item"><strong>Fermé par</strong><span>${escapeHtml(closedBy.user.username)}</span></div>
<div class="meta-item"><strong>Raison</strong><span>${escapeHtml(reason)}</span></div>
<div class="meta-item"><strong>Messages</strong><span>${messages.length}</span></div>
</div>
${ticketData.subject ? `<div class="subject-bar"><strong>📌 Sujet :</strong> ${escapeHtml(ticketData.subject)}${ticketData.description ? `<br><strong>📝 Détails :</strong> ${escapeHtml(ticketData.description)}` : ''}</div>` : ''}
<div class="messages">${rows}</div>
<footer>CrowBot — Transcript généré le ${closedAt}</footer>
</body></html>`

    const dir      = path.join(__dirname, '..', 'system', 'transcripts')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filename = `ticket-${num}-${guild.id}-${Date.now()}.html`
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, html, 'utf8')
    return new AttachmentBuilder(filepath, { name: filename })
  } catch (err) {
    console.error('[TICKET] Erreur transcript:', err.message)
    return null
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

module.exports = { openTicket, closeTicket, buildTranscript, buildTicketModal, sendTicketLog }
