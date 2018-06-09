
/*
* We need a predictable way to store and lookup a conversation between two socket IDs,
* client and server can use this util to ensure that no matter the order of IDs in the query,
* we store and look conversations up in the same way.
*/
const getConvoId = (toId, fromId) => toId > fromId ? `${toId}::${fromId}` : `${fromId}::${toId}`

module.exports = {
  getConvoId
}
