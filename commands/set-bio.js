// ============================================================
//  Commande : set-bio — Ajoute un statut à la rotation
// ============================================================

const db = require('quick.db')

module.exports = {
  name: 'set-bio',
  description: 'Définit la bio du profil du bot privé',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!args[0]) return message.reply('❌ Vous devez fournir un texte de statut !').catch(() => false)

    db.push('status', args.join(' '))
    message.reply('✅ Votre statut a été ajouté ! *(Apparaît dans les 30 secondes max)*')
  },
}
