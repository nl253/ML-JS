const {Classifier} = require('./index');
const KMeans = require('../clustering/kmeans');
const {argMin, euclideanDist} = require("../utils");

class Centroid extends Classifier {

  constructor(data, labels, r = 0.1) {
    super(data, labels, r);
  }

  fit() {
    this.centroids = new KMeans(this.data, this.uniqueLabels.length).cluster();

    // now map unique labels to centroids
    this.table = {};

    for (let c = 0; c < this.centroids.length; c++) {
      this.table[this.uniqueLabels[c]] = Array(this.centroids.length).fill(0);
    }

    for (let c = 0; c < this.centroids.length; c++) {
      for (let row = 0; row < this.data.length; row++) {
        this.table[this.labels[row]][c] += euclideanDist(this.data[row], this.centroids[c]);
      }
    }

    // provide label => centroidIdx mappings
    const centroidsIdxsLeft = new Set(Array(this.centroids.length).fill(0).map((_, idx) => idx));
    for (const l of this.uniqueLabels) {
      let closestCentroidIdx = centroidsIdxsLeft.values().next().value;
      let closestCentroidDist = this.table[l][closestCentroidIdx];
      for (const c of centroidsIdxsLeft) {
        const newDist = this.table[l][c];
        if(newDist < closestCentroidDist) {
          closestCentroidIdx = c;
          closestCentroidDist = newDist;
        }
      }
      this.table[l] = closestCentroidIdx;
      centroidsIdxsLeft.delete(closestCentroidIdx);
    }

    // provide centroidIdx => label mappings AS WELL
    for (const entry of Object.entries(this.table)) {
      const [l, c] = entry;
      delete this.table[l];
      this.table[c] = l;
    }
  }

  predict(x) {
    return this.table[argMin(this.centroids.map((_, idx) => idx), idx => euclideanDist(x, this.centroids[idx]))]
  }
}

module.exports = Centroid;
