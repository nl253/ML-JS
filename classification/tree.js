const {Classifier} = require('.');
const argMin = require('../utils').argMin;
const argMax = require('../utils').argMax;
const {entropy, transpose: t} = require('../utils');

function isPure(cs) {
  const {label} = cs[0];
  for (let c = 1; c < cs.length; c++) {
    if (cs[c].label !== label) return false;
  }
  return true;
}

class DecisionTree extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [maxDepth]
   */
  constructor(data, labels, r = 0.1, maxDepth = 20) {
    super(data, labels, r);
    this.maxDepth = maxDepth;
  }

  /**
   * @param {Array<{label: *, val: Array<*>}>} candidates
   * @return {!Number}
   * @private
   */
  _selAttr(candidates) {
    return argMax(
        this.ps.map((_, idx) => idx),
        attr => entropy(Object.values(this.ps[attr])))
  }

  fit() {
    this.uniqueAttrs = t(this.dataTrain).map(col => Array.from(new Set(col)));
    this.ps = Array(this.featureCount).fill(0).map(_ => new Object());

    // count all vals in all attrs
    for (let row = 0; row < this.dataTrainCount; row++) {
      const datum = this.dataTrain[row];
      for (let col = 0; col < this.featureCount; col++) {
        const attr = datum[col];
        this.ps[col][attr] = (this.ps[col][attr] || 0) + 1;
      }
    }

    // compute probs from counts
    for (let feature = 0; feature < this.featureCount; feature++) {
      const total = Object.values(this.ps[feature]).reduce((count1, count2) => count1 + count2, 0);
      for (const val of Object.keys(this.ps[feature])) {
        this.ps[feature][val] /= total;
      }
    }

    this.tree = this._buildTree(this.dataTrain.map(
        (val, idx) => ({val, label: this.labelsTrain[idx]})), this.maxDepth);
  }

  _buildTree(candidates, depthLimit) {
    if (candidates.length === 0) return null;
    else if (depthLimit <= 0) {
      const label = argMax(
            this.uniqueLabels,
            l => candidates.filter(c => c.label === l).length);
      console.log(`depth limit on label ${label}`);
      return {
        label,
        confidence: candidates.filter(c => c.label === label).length / candidates.length,
        count: candidates.length,
      };
    } else if (isPure(candidates)) {
      console.log(`pure on label ${candidates.label}`);
      return {
        label: candidates[0].label,
        confidence: 1.0,
        count: candidates.length,
      };
    }

    const attr = this._selAttr(candidates);
    console.log(`selected attr ${attr}`);

    const threshold = argMin(
        this.uniqueAttrs[attr],
        val => Math.abs((candidates.length / 2) - candidates.filter(c => c.val[attr] >= val).length));
    console.log(`selected threshold ${threshold}`);

    const left = [];
    const right = [];

    for (const c of candidates) (c.val[attr] < threshold ? left : right).push(c);
    console.log(`#left: ${left.length}, #right: ${right.length}`);

    return {
      attr,
      val: threshold,
      lt: this._buildTree(left, depthLimit - 1),
      gte: this._buildTree(right, depthLimit - 1),
    };
  }

  /**
   * @param {Array<*>} x
   */
  predict(x) {}
}

module.exports = DecisionTree;
