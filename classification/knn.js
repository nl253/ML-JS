const {Classifier} = require('./index');
const {minkowskyDist: dist} = require('../utils');

class KNN extends Classifier {
  /**
   * @param {Array<Array<Number>>} data
   * @param {Array<*>} labels
   * @param {Number} k
   * @param {Number} p
   */
  constructor(data, labels, k = 3, p = 2) {
    super(data, labels);
    this.k = k;
    this.p = p;
  }

  /**
   * @param {Array<Number>} x
   * @param {Number} k
   * @param {Number} p
   * @return {*} prediction
   */
  predict(x, k, p) {
    if (!k) k = this.k;
    if (!p) p = this.p;

    const best = this.data.slice(k).map((b, idx) => this.labels[idx]);

    const bestDist = this.data.slice(k).map(datum => dist(x, datum, p));

    for (let row = k; row < this.data.length; row++) {
      const d = dist(x, this.data[row], p);
      for (let i = 0; i < k; i++) {
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
};

module.exports = KNN;
