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
      this.dims.push([values.reduce((v1, v2) => Math.min(v1, v2)), values.reduce((v1, v2) => Math.max(v1, v2))]);
    }
    // randomly generate k centroids
    this.centroids = Array(k).fill(0).map(_ => Array(data[0].length).fill(0).map((_, idx) => randInRange(this.dims[idx][0], this.dims[idx][1])));
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

    let cache = {};

    do {
      this.oldPos = [].concat(this.pos);
      if (Object.keys(cache).length > this.data.length * 2) cache = {};
      for (let row = 0; row < this.data.length; row++) {
        for (let c = 0; c < this.centroids.length; c++) {
          const newKey = this.data[row].join(',') + ':' + this.centroids[c].join(',');
          let newDist = cache[newKey];
          if (newDist === undefined) {
            newDist = euclideanDist(this.data[row], this.centroids[c]);
            cache[newKey] = newDist;
          }
          const oldKey = this.data[row].join(',') + ':' + this.centroids[this.oldPos[row]];
          let oldDist = cache[oldKey];
          if (oldDist === undefined) {
            oldDist = euclideanDist(this.data[row], this.centroids[this.oldPos[row]]);
            cache[oldKey] = oldDist;
          }
          if (newDist < oldDist) this.pos[row] = c;
        }
      }
      // reposition centroids
      for (let c = 0; c < this.centroids.length; c++) {
        const members = this.data.filter((_, idx) => this.pos[idx] === c);
        // no members, reinitialise pos to random
        if (members.length === 0) {
          this.centroids[c] = Array(this.dims.length).fill(0).map((_, idx) => randInRange(this.dims[idx][0], this.dims[idx][1]));
        } else if (members.length === 1) this.centroids[c] = members[0];
        else this.centroids[c] = this.centroids[c].map((_, dim) => mean(members.map(m => m[dim])));
      }
    } while (!isDone());
    return this.centroids;
  }
}

module.exports = KMeans;
