// ============================================================
//  Événement : roleUpdate — Log modification de rôle
// ============================================================

const { sendLog } = require('../../utils/logs')

module.exports = async (client, oldRole, newRole) => {
  if (!newRole.guild) return
  const changes = []
  if (oldRole.name  !== newRole.name)  changes.push(`**Nom :** \`${oldRole.name}\` → \`${newRole.name}\``)
  if (oldRole.color !== newRole.color) changes.push(`**Couleur :** \`#${oldRole.color.toString(16).padStart(6,'0')}\` → \`#${newRole.color.toString(16).padStart(6,'0')}\``)
  if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) changes.push('**Permissions modifiées**')
  if (changes.length === 0) return

  sendLog(
    newRole.guild, 'roles',
    'Rôle modifié',
    `**Rôle :** <@&${newRole.id}>\n${changes.join('\n')}`,
    0xFFAA00
  )
}
