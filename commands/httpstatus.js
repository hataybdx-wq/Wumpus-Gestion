// ============================================================
//  Commande : httpstatus — Signification d'un code HTTP
// ============================================================

const CODES = {
  200: 'OK — Requête réussie',
  201: 'Created — Ressource créée',
  204: 'No Content — Pas de contenu',
  301: 'Moved Permanently — Redirection permanente',
  302: 'Found — Redirection temporaire',
  304: 'Not Modified — Pas modifié',
  400: 'Bad Request — Requête invalide',
  401: 'Unauthorized — Non authentifié',
  403: 'Forbidden — Accès refusé',
  404: 'Not Found — Ressource introuvable',
  405: 'Method Not Allowed — Méthode non autorisée',
  408: 'Request Timeout — Délai dépassé',
  418: 'I\'m a teapot — Je suis une théière 🫖',
  429: 'Too Many Requests — Rate limit',
  500: 'Internal Server Error — Erreur serveur',
  502: 'Bad Gateway — Mauvaise passerelle',
  503: 'Service Unavailable — Service indisponible',
  504: 'Gateway Timeout — Délai passerelle',
}

module.exports = {
  name: 'httpstatus',
  description: 'Signification d\'un code HTTP',
  aliases: ['http', 'status'],

  run: async (client, message, args, prefix) => {
    const code = parseInt(args[0])
    if (!code) return message.reply(`Usage : \`${prefix}httpstatus <code>\` (ex: \`${prefix}httpstatus 404\`)`)

    const desc = CODES[code]
    if (!desc) return message.reply(`Code \`${code}\` inconnu ou peu courant.`)

    const cat = code < 200 ? '📨 Informationnel' :
                code < 300 ? '✅ Succès' :
                code < 400 ? '🔀 Redirection' :
                code < 500 ? '❌ Erreur client' :
                '💥 Erreur serveur'

    message.reply({ embeds: [{
      title: `HTTP ${code}`,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      description: `**${desc}**\n\n${cat}`,
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
      image: { url: `https://http.cat/${code}.jpg` },
    }] })
  },
}
