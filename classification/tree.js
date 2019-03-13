const {Classifier} = require('.');
const argMax = require('../utils').argMax;
const GA = require('../search/genetic');
const {logSigmoid} = require('../utils/activation');

/**
 * @param {!Number} bitsFeature
 * @param {!Number} bitsVal
 * @return {!String} bit string
 */
function makeCandidate(bitsFeature, bitsVal) {
  return Array(bitsFeature).
      fill(0).
      map(_ => Math.round(Math.random()).toString()).
      join('') +
      (Math.random() >= 0.5 ? '0' : '1') +
      Array(bitsVal).
          fill(0).
          map(_ => Math.round(Math.random()).toString()).
          join('');
}


/**
 * @param {!Number} featureIdx
 * @param {!String} op
 * @param {!Number} valIdx
 * @param {!Array<{val: *, label: *}>} candidates
 * @param {!Number} [minLeafItems]
 * @return {!Number} fitness score
 */
function fitnessF({featureIdx, op, valIdx}, candidates, minLeafItems = 5) {
  const t = [];
  const f = [];
  const opF = op === 'gte' ? (a, b) => a >= b : (a, b) => a < b;
  const val = candidates[valIdx].val[featureIdx];
  for (const c of candidates) {
    if (opF(c.val[featureIdx], val)) t.push(c);
    else f.push(c);
  }
  return Math.max(-1, -(Math.abs((candidates.length / 2) - t.length)) / (candidates.length / 2)) + (t.length >= minLeafItems && f.length > minLeafItems ? Math.max(purity(t) * 1.5, purity(f) * 1.5) : -1);
}

/**
 * @param {!String} bits
 * @param {!Number} bitsFeature
 * @param {!Number} bitsVal
 * @param {!Number} candidateCount
 * @param {!Number} featureCount
 * @return {!{op: String, featureIdx: Number, valIdx: Number}} decoded candidate
 */
function decode(bits, bitsFeature, bitsVal, candidateCount, featureCount) {
  return {
    featureIdx: eval(`0b${bits.slice(0, bitsFeature)}`) % featureCount,
    op: bits[bitsFeature] === '0' ? 'gte' : 'lt',
    valIdx: eval(`0b${bits.slice(bitsFeature + 1)}`) % candidateCount,
  };
}

/**
 * @param {!Array<{label: *}>} cs
 * @return {!Number} purity ratio [0, 1]
 */
function purity(cs) {
  const index = {};
  for (let c = 0; c < cs.length; c++) {
    index[cs[c].label] = (index[cs[c].label] || 0) + 1;
  }
  return Object.values(index).reduce((c1, c2) => Math.max(c1, c2)) / cs.length;
}

class DecisionTree extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [minLeafItems]
   * @param {!Number} [minPurity]
   * @param {!Number} [maxDepth]
   */
  constructor(
      data, labels, r = 0.1, minLeafItems = 5, minPurity = 0.8, maxDepth = 15) {
    super(data, labels, r);
    this.maxDepth = maxDepth;
    this.minLeafItems = minLeafItems;
    this.minPurity = 0.8;
  }

  fit() {
    this.tree = this._buildTree(
        this.dataTrain.map((val, idx) => ({val, label: this.labelsTrain[idx]})),
        this.maxDepth);
  }

  _buildTree(candidates, depthLimit) {
    if (candidates.length === 0) return null;
    else if (depthLimit <= 0 || candidates.length < this.minLeafItems) {
      const label = argMax(
          this.uniqueLabels,
          l => candidates.filter(c => c.label === l).length);
      console.log(`depth limit on label ${label} or min children (${candidates.length}/${this.minLeafItems})`);
      return {
        label,
        confidence: candidates.filter(c => c.label === label).length / candidates.length,
        count: candidates.length,
      };
    } else {
      const purityScore = purity(candidates);
      if (purityScore >= this.minPurity) {
        console.log(`pure on #candidates = ${candidates.length}`);
        return {
          label: candidates[0].label,
          confidence: purityScore,
          count: candidates.length,
        };
      }
    }

    const bitsFeature = Math.ceil(Math.log2(this.featureCount));
    const bitsVal = Math.ceil(Math.log2(candidates.length));

    const ga = new GA(
        Array(100).fill(0).map(_ => makeCandidate(bitsFeature, bitsVal)),
        bits => fitnessF(decode(bits, bitsFeature, bitsVal, candidates.length, this.featureCount), candidates, this.minLeafItems),
        200, 3, 1, 3.5, 7);

    const {featureIdx, op, valIdx} = decode(ga.search()[0], bitsFeature, bitsVal, candidates.length, this.featureCount);

    const t = [];
    const f = [];
    const opF = op === 'gte' ? (a, b) => a >= b : (a, b) => a < b;
    const val = candidates[valIdx].val[featureIdx];
    for (const c of candidates) {
      if (opF(c.val[featureIdx], val)) t.push(c);
      else f.push(c);
    }

    return {
      attr: featureIdx,
      threshold: candidates[valIdx].val[featureIdx],
      op,
      t: this._buildTree(t, depthLimit - 1),
      f: this._buildTree(f, depthLimit - 1),
    };
  }

  /**
   * @param {Array<*>} x
   */
  predict(x) {}
}

module.exports = DecisionTree;
