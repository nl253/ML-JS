const {readFileSync} = require('fs');

/**
 * @param {!String} filePath
 * @returns {JSON}
 */
function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath).toString('utf-8'));
}

/**
 * @param {!String} filePath
 * @returns {string[][]}
 */
function readCSV(filePath) {
  return readFileSync(filePath).
      toString('utf-8').
      split(/\r\n|\n\r?/).
      map(x => x.split(','));
}

module.exports = {readCSV, readJSON};
