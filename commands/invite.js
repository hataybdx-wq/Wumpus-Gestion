module.exports = {
  name: 'invite',
  description: 'Lien d\'invitation du bot',
  aliases: [],
  run: async (client, message) => {
    const invite = 'https://discord.com/oauth2/authorize?client_id=1494736949985021952&permissions=8&integration_type=0&scope=bot'
    const support = 'https://discord.gg/n64X38d8'
    message.reply(`**Invite-moi :** ${invite}\n**Serveur support :** ${support}`)
  },
}
