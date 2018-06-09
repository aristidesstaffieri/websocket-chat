const tap = require('tap')
const { getConvoId } = require('../../utils/utils.js')

tap.equal(getConvoId('a', 'b'), 'b::a')
tap.equal(getConvoId('z', 'a'), 'z::a')
tap.equal(getConvoId(123, 'a'), 'a::123')
