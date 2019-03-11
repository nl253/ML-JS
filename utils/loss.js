/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @return {!Number} mean squared error
 */
function mse(xs, ys) {
  return xs.map((v, idx) => (v - ys[idx])**2).reduce((v1, v2) => v1 + v2) / xs.length;
}
/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @return {!Number} mean absolute error
 */
function mae(xs, ys) {
  return xs.map((v, idx) => Math.abs(v - ys[idx])).reduce((v1, v2) => v1 + v2) / xs.length;
}

module.exports = {mse, mae};
