const { readFileSync } = require('fs');

/**
 * @param {!string} filePath
 * @returns {JSON}
 */
function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath).toString('utf-8'));
}

/**
 * @param {!String} filePath
 * @returns {Array<Array<String>>} table
 */
function readCSV(filePath, hasHeader = false) {
  let rows = readFileSync(filePath)
    .toString('utf-8')
    .split(/\r?\n/g)
    .map(x => x.split(','));
  if (rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows = rows.slice(0, rows.length - 1);
  }
  if (hasHeader) rows = rows.slice(1, rows.length);
  return rows;
}

module.exports = { readCSV, readJSON };
