var la = require('lazy-ass')
var check = require('check-more-types')

var q = require('q')
var fs = require('fs')
var S = require('spots')
var debug = require('debug')('chdir-promise')

// stack
var folders = []

function _to (folderName) {
  la(check.unemptyString(folderName), 'missing git repo folder')
  la(fs.existsSync(folderName), 'cannot find folder', folderName)

  var current = process.cwd()
  la(check.unemptyString(folderName), 'missing folder')
  process.chdir(folderName)
  debug('chdir to folder', process.cwd())

  folders.push(current)

  return current
}

function comeBack () {
  if (!folders.length) {
    return Promise.resolve()
  }
  var folder = folders.pop()
  process.chdir(folder)
  debug('restored folder', folder)
  return Promise.resolve(folder)
}

module.exports = {
  to: S(q.try, _to, S),
  back: comeBack,
  from: comeBack
}
