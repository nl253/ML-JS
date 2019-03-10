const { mean } = require('../utils/stats');
const { randInRange } = require('../utils/random');
const { euclideanDist } = require('../utils');

class KMeans {
  /**
   * @param {!Array<Array<Number>>} data
   * @param {!Number} [k]
   */
  constructor(data, k = 2) {
    this.k = k;
    this.data = data;
    this.dims = [];
    for (let col = 0; col < data[0].length; col++) {
      const values = data.map(row => row[col]);
      this.dims.push([
        values.reduce((v1, v2) => Math.min(v1, v2)),
        values.reduce((v1, v2) => Math.max(v1, v2)),
      ]);
    }
    // randomly generate k centroids
    this.centroids = Array(k).fill(0).map(_ => Array(data[0].length).fill(0).map((_, idx) => randInRange(this.dims[idx][0], this.dims[idx][1])));
  }

  cluster() {

    // oldPos & pos stores index of centroid
    let oldPos = Array(this.data.length).fill(0);
    const pos = Array(this.data.length).fill(1);

    function isDone() {
      for (let i = 0; i < pos.length; i++) {
        if (pos[i] !== oldPos[i]) return false;
      }
      return true;
    }

    while (!isDone()) {
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
        let members = this.data.filter((_, idx) => pos[idx] === c);
        // no members, reinitialise pos to random
        if (members.length === 0) {
          this.centroids[c] = Array(this.dims.length).fill(0).map((_, idx) => randInRange(this.dims[idx][0], this.dims[idx][1]));
        } else if (members.length === 1) this.centroids[c] = members[0];
        else this.centroids[c] = this.centroids[c].map((_, dim) => mean(members.map(m => m[dim])));
      }
    }
    return this.centroids;
  }
}

module.exports = KMeans;
