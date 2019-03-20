/**
 * @param {!Array<!Number>} data
 * @param {!Array<*>} [labels]
 * @param {!Array<!Number>} [nums]
 * @param {!Boolean} [doSort]
 */
function categorize(data = [], labels = ['low', 'medium', 'high'], nums = [0.3, 0.6, 1], doSort = false) {
  if (doSort) nums = nums.sort();
  const result = [];
  for (let row = 0; row < data.length; row++) {
    for (let n = 0; n < nums.length; n++) {
      if (data[row] < nums[n]) {
        result.push(labels[n]);
        break;
      }
    }
  }
  return result;
}

/**
 * @param {!Array<!Number>|!TypedArray} column
 * @return {!Array<!Number>|!TypedArray} normalized column
 */
function normalize(column) {
  const max = column.map(v => Math.abs(v)).reduce((v1, v2) => Math.max(v1, v2));
  if (column.constructor.name === 'Array') {
    return column.map(v => v / max);
  }
  // for typed arrays
  const buf = new ArrayBuffer(column.length * 4);
  const newArr = new Float32Array(buf)  ;
  for (let i = 0; i < column.length; i++) {
    newArr[i] = column[i] / max;
  }
  return newArr;
}

/**
 * @param {!Array<String>} words
 * @param {!Number} [n] len of vector
 * @returns Array<Number> count vector
 */
function hashingTrick(words, n = 100) {
  const counts = Array(n).fill(0);
  for (const s of words) {
    counts[(s.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) % n)]++;
  }
  return counts;
}

module.exports = {
  categorize,
  hashingTrick,
  normalize,
};
