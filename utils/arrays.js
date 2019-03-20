// noinspection JSUnusedLocalSymbols
const { bag } = require('.');
// noinspection JSUnusedLocalSymbols
const { normalize } = require('./preprocessing');
// noinspection JSUnusedLocalSymbols
const {
  mad,
  max,
  mean,
  median,
  min,
  mode,
  nQuart,
  stdev,
  variance,
} = require('./stats');
// noinspection JSUnusedLocalSymbols
const { sum, product, argMax, argMin } = require('./math');

const isNumRegex = /^(\d+\.?\d*|\d*\.\d+)$/g;
const bitsRegex = /(64|32|16|8)/;

/**
 * @param {!TypedArray|!Array<*>} a
 * @return {!TypedArray|!Array<*>} the array
 */
function enhanceArray(a) {
  const defineGetter = (name, f) => Object.defineProperty(a, name, {get: f});
  const defineF = (name, f) => a[name] = f;
  for (const f of [
    // stats
    'mad',
    'max',
    'mean',
    'median',
    'min',
    'mode',
    'stdev',
    'variance',
    // math
    'product', 'sum',
  ]) {
    defineGetter(f, function () {return eval(f)(this);});
  }
  for (const f of ['argMax', 'argMin']) {
    defineF(f, function(f) {return eval(f)(this, f);});
  }
  defineF('swap', function(i, j) { swap(this, i, j); });
  defineGetter('clone', function () {
      const a = getTypedArray(this.constructor.name.replace('Array', ''), this.length);
      a.set(this);
      return a;
    });
  defineGetter('normalized', function () {return normalize(this);});
  defineGetter('count', function () {return bag(this);});
  defineGetter('shuffled', function () {
      const a = this.clone;
      shuffle(a);
      return a;
    });
  return a;
}

/**
 * @param {!Array<*>|!TypedArray} xs
 * @param {!Number} i
 * @param {!Number} j
 */
function swap(xs, i, j) {
  const save = xs[i];
  xs[i] = xs[j];
  xs[j] = save;
}

/**
 * Shuffles array in place.
 *
 * @param {!Array<*>|!TypedArray} a items An array containing the items.
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {"BigUint64"|"Uint32"|"Uint16"|"Uint8"|"BigInt64"|"Int32"|"Int16"|"Int8"|"Float64"|"Float32"} dtype
 * @param {!Number} [len]
 * @return {!TypedArray}
 */
function getTypedArray(dtype = 'Float32', len = 0) {
  const match = bitsRegex.exec(dtype);
  const bytesNeeded = parseInt(match[1]) / 8;
  const constructor = eval(`${dtype}Array`);
  return enhanceArray(new constructor(new ArrayBuffer(bytesNeeded * len)));
}

/**
 * @param {!Array<!Number>|!Array<String>} col
 * @return {!TypedArray|!Array<String>} typed array
 * @param {"BigUint64"|"Uint32"|"Uint16"|"Uint8"|"BigInt64"|"Int32"|"Int16"|"Int8"|"Float64"|"Float32"} defaultDtype
 */
function toTypedArray(col, defaultDtype = 'Float32') {
  if (col.length === 0) {
    // return empty arrays
    return col;
  }
  else if (col[0].constructor.name === 'String') {
    // parse string cols that are actually nums
    if (isNumCol(col)) col = col.map(parseFloat);
    // but return string cols that aren't nums
    else return col;
  } else if (col.constructor.name.indexOf('Array') >= 0 && col.constructor.name !== 'Array') {
    // return typed arrays unchanged
    return col;
  }
  let dtype = defaultDtype;
  const isInt = !col.some(v => v !== Math.trunc(v));
  if (isInt) {
    const maxVal = col.map(v => Math.abs(v)).reduce((v1, v2) => Math.max(v1, v2));
    const bitsNeeded = Math.ceil(Math.log2(maxVal));
    const isNeg = col.some(v => v < 0);
    if (!isNeg) {
      if (bitsNeeded <= 8) {
        dtype = 'Uint8';
      } else if (bitsNeeded <= 16) {
        dtype = 'Uint16';
      } else if (bitsNeeded <= 32) {
        dtype = 'Uint32';
      } else if (bitsNeeded <= 64) {
        dtype = 'BigUint64';
      } else throw new Error('too large numbers to represent using typed arrays');
    } else if (bitsNeeded <= 4) {
      dtype = 'Int8';
    } else if (bitsNeeded <= 8) {
      dtype = 'Int16';
    } else if (bitsNeeded <= 16) {
      dtype = 'Int32';
    } else if (bitsNeeded <= 32) {
      dtype = 'BigInt64';
    } else throw new Error('too large numbers to represent using typed arrays');
  }
  const view = getTypedArray(dtype, col.length);
  view.set(col);
  return view;
}

/**
 * @param {!Array<String>|!TypedArray} col
 * @return {!Boolean}
 */
function isNumCol(col) {
  return !col.find(val => !val.match(isNumRegex));
}

/**
 * @param {!Array<Array<*>>|!Array<*>} xs
 * @returns {!Array<Array<*>>|!Array<*>} transpose
 */
function transpose(xs) {
  if (xs[0].constructor.name !== 'Array') {
    return xs.map(x => [x]);
  }
  const colCount = xs[0].length;
  const rowCount = xs.length;
  const m = Array(colCount).fill(0).map(_ => Array(rowCount).fill(0));
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < xs[i].length; j++) {
      m[j][i] = xs[i][j];
    }
  }
  return m;
}

/**
 *
 * @param {!Number} [a]
 * @param {!Number} [b]
 * @param {!Number} [step]
 * @returns {!Array<Number>} range
 */
function range(a = 0, b, step = 1) {
  return Array.from(rangeIter(a, b, step));
}

/**
 *
 * @param {!Number} [a]
 * @param {!Number} [b]
 * @param {!Number} [step]
 * @returns {!Array<Number>} range
 */
function* rangeIter(a = 0, b, step = 1) {
  if (b === undefined) {
    yield * range(0, a, step);
  }
  for (let i = a; i < b; i += step) yield i;
}

module.exports = {
  swap,
  shuffle,
  getTypedArray,
  toTypedArray,
  isNumCol,
  range,
  transpose,
  enhanceArray,
  rangeIter,
};
