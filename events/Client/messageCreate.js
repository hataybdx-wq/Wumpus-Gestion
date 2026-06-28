// ============================================================
//  Événement : messageCreate — Routeur de commandes
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = async (client, message) => {
  if (!message.guild)     return
  if (message.author.bot) return
  if (!message.content)   return

  let prefix = db.get(`${message.guild.id}.prefix`) || process.env.prefix || '!'

  // ── Auto-réponses ────────────────────────────────────────
  const ars = db.get(`autoresponders_${message.guild.id}`) || {}
  const arKeys = Object.keys(ars)
  if (arKeys.length > 0 && !message.content.startsWith(prefix)) {
    const lower = message.content.toLowerCase()
    const match = arKeys.find(k => lower.includes(k))
    if (match) {
      const response = ars[match]
        .replace(/\{user\}/g,    message.author.username)
        .replace(/\{mention\}/g, `<@${message.author.id}>`)
        .replace(/\{server\}/g,  message.guild.name)
      message.channel.send(response).catch(() => false)
      // On continue quand même pour permettre les commandes qui contiendraient le trigger
    }
  }

  if (message.content.match(new RegExp(`^<@!?${client.user.id}>\\s*$`))) {
    // ── Vérification du tag pseudo ─────────────────────────
    const realTagCfg = db.get(`tag_${message.guild.id}`)

    if (
      realTagCfg?.active &&
      realTagCfg?.roleId &&
      realTagCfg?.text &&
      realTagCfg?.channelId &&
      message.channel.id === realTagCfg.channelId
    ) {
      const member  = message.member
      const pseudo  = (member.nickname ?? member.user.username ?? '').toLowerCase()
      const tag     = realTagCfg.text.toLowerCase()
      const hasTag  = pseudo.includes(tag)
      const hasRole = member.roles.cache.has(realTagCfg.roleId)

      if (hasTag && !hasRole) {
        await member.roles.add(realTagCfg.roleId, 'Tag vérifié dans le pseudo').catch(() => false)
        return message.reply({ content: `Le rôle <@&${realTagCfg.roleId}> vous a été attribué ! Merci pour votre soutien.`, allowedMentions: { repliedUser: true } }).catch(() => false)
      } else if (hasTag && hasRole) {
        return message.reply({ content: `Vous avez déjà le rôle <@&${realTagCfg.roleId}>.`, allowedMentions: { repliedUser: true } }).catch(() => false)
      } else {
        return message.reply({ content: `Votre pseudo ne contient pas le tag requis : \`${realTagCfg.text}\`\nAjoutez-le à votre pseudo puis réessayez.`, allowedMentions: { repliedUser: true } }).catch(() => false)
      }
    }

    return message.channel.send(`Préfixe sur ce serveur : \`${prefix}\``).catch(() => {})
  }

  if (!message.content.startsWith(prefix)) return

  if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.Administrator))
    return message.channel.send('Je n\'ai pas la permission `ADMINISTRATEUR`.').catch(() => false)

  const parts       = message.content.slice(prefix.length).trim().split(/ +/)
  const commandName = parts.shift().toLowerCase()
  const args        = parts

  const cmdName = client.commands.has(commandName)
    ? commandName
    : client.aliases.get(commandName)

  if (!cmdName) return
  const command = client.commands.get(cmdName)
  if (!command) return

  // Ignorer les commandes slash-only (pas de run)
  if (typeof command.run !== 'function') return

  try {
    await command.run(client, message, args, prefix)
  } catch (err) {
    console.error(`[CMD ERROR] ${commandName}:`, err.message)
    message.reply('Une erreur est survenue.').catch(() => false)
  }
}
