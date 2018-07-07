function alwaysError (x) {
  if (x instanceof Error) {
    return x
  }

  if (typeof x === 'string') {
    return new Error(x)
  }

  throw new Error('Cannot convert ' + x + ' to Error instance!')
}

module.exports = alwaysError
