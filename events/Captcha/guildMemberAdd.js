// ============================================================
//  Événement : guildMemberAdd (Captcha)
//  discord.js v14 : EmbedBuilder remplace MessageEmbed
// ============================================================

const db = require('quick.db')
const { EmbedBuilder } = require('discord.js')

module.exports = async (client, member) => {
  if (db.get(`captcha_${member.guild.id}`) !== true) return

  const guild   = member.guild
  const channel = guild.channels.cache.get(db.get(`captchachannel_${guild.id}`))
  const role    = guild.roles.cache.get(db.get(`captcharole_${guild.id}`))

  if (!role || !channel) return

  // discord.js-captcha v4 accepte EmbedBuilder
  let Captcha
  try { Captcha = require('discord.js-captcha').Captcha } catch { return }

  const captcha = new Captcha(client, {
    guildID:           guild.id,
    roleID:            role.id,
    channelID:         channel.id,
    sendToTextChannel: true,
    addRoleOnSuccess:  true,
    kickOnFailure:     true,
    caseSensitive:     false,
    attempts:          3,
    timeout:           60000,
    showAttemptCount:  true,
    customPromptEmbed: new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription('> **Tu dois valider ce captcha pour accéder au serveur**'),
      .setFooter({ text: 'Made by Wumpus' })
    customSuccessEmbed: new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription('Captcha validé ✅').setColor(0x00FF00),
      .setFooter({ text: 'Made by Wumpus' })
    customFailureEmbed: new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription('Captcha raté ❌').setColor(0xFF0000),
      .setFooter({ text: 'Made by Wumpus' })
  })

  captcha.present(member)
}
