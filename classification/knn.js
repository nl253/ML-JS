const {Classifier} = require('./index');
const {euclideanDist} = require('../utils');
const log = require('../utils/log');

class KNN extends Classifier {
  /**
   * @param {Array<Array<Number>>} data
   * @param {Array<*>} labels
   * @param {Number} k
   * @param {!Function} [distF]
   */
  constructor(data, labels, k = 3, distF = euclideanDist) {
    super(data, labels);
    this.distF = distF;
    this.k = k;
  }

  fit() {
    log.warn(`fitting not needed for ${this.constructor.name}`);
  }

  /**
   * @param {Array<Number>} x
   * @return {*} prediction
   */
  predict(x) {
    const best = this.data.slice(this.k).map((b, idx) => this.labels[idx]);

    const bestDist = this.data.slice(this.k).map(datum => this.distF(x, datum, this.p));

    for (let row = this.k; row < this.data.length; row++) {
      const d = this.distF(x, this.data[row], this.p);
      for (let i = 0; i < this.k; i++) {
        if (bestDist[i] > d) {
          best[i] = this.labels[row];
          bestDist[i] = d;
          break;
        }
      }
    }

    const attrCounts = {};
    for (const b of best) {
      if (attrCounts[b] === undefined) {
        attrCounts[b] = 1;
      } else attrCounts[b]++;
    }

    return Object.entries(attrCounts).sort((a, b) => {
      if (a[1] < b[1]) return 1;
      else if (a[1] > b[1]) return -1;
      else return 0;
    })[0][0];
  }
}

module.exports = KNN;
