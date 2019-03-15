const { mean } = require('../utils/stats');
const { randInRange } = require('../utils/random');
const { euclideanDist } = require('../utils');

class KMeans {
  /**
   * @param {!Array<Array<Number>>} data
   * @param {!Number} [k] number of centroids (min. 2)
   */
  constructor(data, k = 2) {
    this.data = data;
    this.k = k;

    // compute the [min, max] range for all features
    this.dims = Array(this.data[0].length).fill(0).map((_, col) => {
      const colVals = data.map(row => row[col]);
      return {
        min: colVals.reduce((v1, v2) => Math.min(v1, v2)),
        max: colVals.reduce((v1, v2) => Math.max(v1, v2)),
      }
    });

    // randomly generate k centroids
    this.centroids = Array(this.k).fill(0);

    this.randomizeCentroid = function(n) {
      this.centroids[n] = Array(this.data[0].length).fill(0).map((_, idx) => randInRange(this.dims[idx].min, this.dims[idx].max));
    };

    for (let i = 0; i < this.k; i++) this.randomizeCentroid(i);
  }

  cluster() {
    // oldPos & pos stores index of centroid
    let oldPos = Array(this.data.length).fill(0);
    let pos = Array(this.data.length).fill(1);

    const isDone = () => {
      for (let i = 0; i < pos.length; i++) {
        if (pos[i] !== oldPos[i]) return false;
      }
      return true;
    };

    do {
      oldPos = [].concat(pos);
      for (let row = 0; row < this.data.length; row++) {
        for (let c = 0; c < this.centroids.length; c++) {
          if (euclideanDist(this.data[row], this.centroids[c]) < euclideanDist(this.data[row], this.centroids[oldPos[row]])) {
            pos[row] = c;
          }
        }
      }
      // reposition centroids
      for (let c = 0; c < this.centroids.length; c++) {
        const members = this.data.filter((_, idx) => pos[idx] === c);
        // no members, reinitialise pos to random
        if (members.length === 0) this.randomizeCentroid(c);
        else if (members.length === 1) this.centroids[c] = members[0];
        else this.centroids[c] = this.centroids[c].map((_, dim) => mean(members.map(m => m[dim])));
      }
    } while (!isDone());
    return this.centroids;
  }
}

module.exports = KMeans;
