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
    this.dims = Array(data[0].length).fill(0)
                                     .map((_, col) => {
      const colVals = data.map(row => row[col]);
      return {
        min: colVals.reduce((v1, v2) => Math.min(v1, v2)),
        max: colVals.reduce((v1, v2) => Math.max(v1, v2)),
      }
    });

    // randomly generate k centroids
    this.centroids = Array(k).fill(0);
    this.randomizeCentroid = function(n) {
      this.centroids[n] = Array(this.data[0].length).fill(0).map((_, idx) => randInRange(this.dims[idx].min, this.dims[idx].max));
    };
    for (let i = 0; i < k; i++) this.randomizeCentroid(i);

    // oldPos & pos stores index of centroid
    this.oldPos = Array(data.length).fill(0);
    this.pos = Array(data.length).fill(1);
  }

  cluster() {
    const isDone = () => {
      for (let i = 0; i < this.pos.length; i++) {
        if (this.pos[i] !== this.oldPos[i]) return false;
      }
      return true;
    };

    do {
      this.oldPos = [].concat(this.pos);
      for (let row = 0; row < this.data.length; row++) {
        for (let c = 0; c < this.centroids.length; c++) {
          if (euclideanDist(this.data[row], this.centroids[c]) < euclideanDist(this.data[row], this.centroids[this.oldPos[row]])) {
            this.pos[row] = c;
          }
        }
      }
      // reposition centroids
      for (let c = 0; c < this.centroids.length; c++) {
        const members = this.data.filter((_, idx) => this.pos[idx] === c);
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
