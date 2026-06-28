// ============================================================
//  utils/logs.js — Système de logs centralisé
//
//  Types :
//    mod      → bans, kicks, mutes, tempbans, clears
//    secur    → anti-spam, anti-bot, protections
//    members  → arrivées, départs, surnoms
//    messages → suppressions, modifications
//    voice    → vocal
//    invites  → invitations
//    roles    → rôles
//    channels → salons (SÉPARÉ de mod)
// ============================================================

'use strict'

const { EmbedBuilder } = require('discord.js')
const db = require('quick.db')

async function sendLog(guild, type, title, desc, color = 0xFF0000, extra = []) {
  if (!guild) return

  const channelId = db.get(`logs_${type}_${guild.id}`) || db.get(`logs_${guild.id}`)
  if (!channelId) return

  const channel = guild.channels.cache.get(channelId)
  if (!channel) return

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setFooter({ text: 'Made by Wumpus' })
    .setTimestamp()

  if (extra.length > 0) embed.addFields(extra)

  channel.send({ embeds: [embed] }).catch(() => false)
}

module.exports = { sendLog }
