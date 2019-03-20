const {getTypedArray} = require('./arrays');

/**
 * @param {!Function} f
 * @param {!Array<*>|!TypedArray} xs
 * @param {!Array<*>|!TypedArray} ys
 * @param {"BigUint64"|"Uint32"|"Uint16"|"Uint8"|"BigInt64"|"Int32"|"Int16"|"Int8"|"Float64"|"Float32"} dtype
 */
function zipWith(f, xs, ys, dtype = 'Float32') {
  const arr = getTypedArray(dtype, xs.length);
  for (let i = 0; i < xs.length; i++) {
    arr[i] = f(xs[i], ys[i]);
  }
  return arr;
}

/**
 * @param {!Function} f
 * @param {!Array<*>|!TypedArray} xs
 * @param {!Array<*>|!TypedArray} ys
 * @param {!Array<*>|!TypedArray} zs
 * @param {"BigUint64"|"Uint32"|"Uint16"|"Uint8"|"BigInt64"|"Int32"|"Int16"|"Int8"|"Float64"|"Float32"} dtype
 */
function zipWith3(f, xs, ys, zs, dtype = 'Float32') {
  const arr = getTypedArray(dtype, xs.length);
  for (let i = 0; i < xs.length; i++) {
    arr[i] = f(xs[i], ys[i], zs[i]);
  }
  return arr;
}

module.exports = {zipWith, zipWith3};
