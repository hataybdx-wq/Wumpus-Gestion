// ── Anti-Link (SecurMax) — détection complète ──────────────────
const { applySanction, isExempt } = require('../../utils/sanction')
const db = require('quick.db')

// URL regex — ne matche que les vrais liens :
// - http(s):// ou www. obligatoire pour les URLs génériques
// - OU invitation Discord explicite
// On évite les faux positifs sur des mots comme "bonjour.fr", "truc.com" dans du texte normal
const URL_REGEX = /(?:https?:\/\/|www\.)\S+/gi

// Invitations Discord
const DISCORD_INVITE = /(?:discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[\w-]+/gi

module.exports = async (client, message) => {
  const guild = message.guild
  if (!guild) return
  if (message.author.bot) return
  if (db.get(`link_${guild.id}`) !== true) return
  if (isExempt(guild, message.author.id, 'link')) return

  const content = message.content
  if (!content) return

  // Mode de détection
  // 'all'     → bloque tous les liens (défaut en SecurMax)
  // 'invites' → bloque uniquement les invitations Discord
  const mode = db.get(`link_mode_${guild.id}`) || 'all'

  // Whitelist de domaines autorisés
  const whitelist = db.get(`link_whitelist_${guild.id}`) || []

  let matchedLink = null
  let reason = ''

  if (mode === 'invites') {
    // Mode "invites only" : que les invites Discord
    const match = content.match(DISCORD_INVITE)
    if (match) {
      matchedLink = match[0]
      reason = 'Anti-Lien : invitation Discord envoyée sans autorisation'
    }
  } else {
    // Mode "all" : tous les liens sauf whitelist
    const matches = content.match(URL_REGEX) || []

    for (const link of matches) {
      // Extraire le domaine
      const domain = link
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase()

      // Vérifier la whitelist (match exact ou sous-domaine)
      const isWhitelisted = whitelist.some(wl => {
        const w = wl.toLowerCase().replace(/^www\./, '')
        return domain === w || domain.endsWith('.' + w)
      })

      if (!isWhitelisted) {
        matchedLink = link
        reason = `Anti-Lien : lien non autorisé (\`${domain}\`)`
        break
      }
    }
  }

  if (!matchedLink) return

  // Supprimer le message + sanctionner selon config
  message.delete().catch(() => false)

  const executor = await guild.members.fetch(message.author.id).catch(() => null)
  
  // Utilise la sanction configurée dans antilien (au lieu de set-sanction)
  const sanctionType = db.get(`link_sanction_${guild.id}`) || 'kick'
  
  // Appliquer la sanction spécifique
  if (executor) {
    try {
      switch (sanctionType) {
        case 'warn':
          await executor.user.send(
            `**Avertissement — ${guild.name}**\n` +
            `${reason}\n` +
            `Lien détecté : \`${matchedLink}\``
          ).catch(() => false)
          break
        case 'mute':
          await executor.timeout(60 * 60 * 1000, reason).catch(() => false)
          break
        case 'kick':
          await executor.kick(reason).catch(() => false)
          break
        case 'ban':
          await executor.ban({ reason }).catch(() => false)
          break
      }
    } catch (err) {
      console.error('[ANTILINK] Erreur sanction:', err.message)
    }
  }
}
