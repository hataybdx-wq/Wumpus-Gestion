// ============================================================
//  Événement : roleCreate — Log création de rôle
// ============================================================

const { sendLog } = require('../../utils/logs')

module.exports = async (client, role) => {
  if (!role.guild) return
  sendLog(
    role.guild, 'roles',
    'Rôle créé',
    `**Rôle :** <@&${role.id}> (\`${role.name}\`)\n**ID :** \`${role.id}\``,
    0x00FF88
  )
}
