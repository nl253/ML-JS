const {Classifier} = require('.');
const argMax = require('../utils').argMax;
const GA = require('../search/genetic');
const {randBitStr} = require('../utils/random');

/**
 * @param {{label: *, confidence: !Number, support: !Number, count: !Number}|{attr: *, op: !String, threshold: *, t: Object, f: Object}} node
 * @return {Array<Array<{label: *, confidence: !Number, support: !Number, count: !Number}|{attr: *, op: !String, threshold: *}>>} rules
 * @private
 */
function collectRules(node) {
  if (node === null) return [];
  else if (node.label) {
    const {label,confidence, support, count} = node;
    return [[{label, confidence, support, count}]];
  } else {
    const {attr, threshold, t, f, op} = node;
    const rules = [];
    for (const subTree of [t, f]) {
      for (const r of collectRules(subTree)) {
        rules.push([{attr, op, threshold}].concat(r));
      }
    }
    return rules;
  }
}

/**
 * @param {{threshold: Number, attr: Number, t: Object, f: Object, op: String, support: Number, confidence: Number, label: *}} node
 * @param {*} x
 * @return {*}
 * @private
 */
function walkPredict(node, x) {
  if (node === null) return null;
  else if (node.confidence) {
    const {label, confidence, support} = node;
    console.log(`Conf(${label}) = ${confidence}`);
    console.log(`Supp(${label}) = ${support}`);
    return label;
  }
  const {attr, t, f, op, threshold} = node;
  if ((op === 'lt' ? (a, b) => a < b : (a, b) => a >= b)(x[attr], threshold)) return walkPredict(t, x);
  else return walkPredict(f, x);
}

/**
 * @param {!Number} popSize
 * @param {!Number} bitsFeature
 * @param {!Number} bitsVal
 * @return {!Array<!String>} population
 * @private
 */
function makePopulation(popSize, bitsFeature, bitsVal) {
  return Array(popSize).fill(0).map(_ =>
      randBitStr(bitsFeature) + (Math.random() >= 0.5 ? '0' : '1') + randBitStr(bitsVal));
}

/**
 * @param {!Number} featureIdx
 * @param {!String} op "gte" or "lt"
 * @param {!Number} valIdx
 * @param {!Array<{val: *, label: *}>} candidates
 * @param {!Number} [minLeafItems]
 * @return {!Number} fitness score
 * @private
 */
function fitnessF({featureIdx, op, valIdx}, candidates, minLeafItems = 6) {
  const t = [];
  const f = [];
  const opF = op === 'gte' ? (a, b) => a >= b : (a, b) => a < b;
  const val = candidates[valIdx].val[featureIdx];
  for (const c of candidates) {
    if (opF(c.val[featureIdx], val)) t.push(c);
    else f.push(c);
  }

  let fitness = 0;

  // FACTOR #1
  // penalise if the split between f and t IS NOT equal
  // thus the cost is the offset from the difference from candidates.length / 2
  const half = candidates.length / 2;
  const offsetFromHalf = Math.abs(t.length - half);
  // log will flatten it because this number can grow a lot
  if (offsetFromHalf === 0) fitness += 1;
  else fitness -= offsetFromHalf / half;

  // FACTOR #2
  // penalise if too few items in each bin
  // focus on the smaller bin
  const smBinSize = Math.min(t.length, f.length);
  fitness += (smBinSize - minLeafItems) / minLeafItems;

  // FACTOR #3
  // penalise if *one* of the bins is not highly homogeneous (pure)
  // this is the most important factor
  fitness -= (1 - Math.max(purity(t), purity(f))) * 2;

  return fitness;
}

/**
 * @param {!String} bits
 * @param {!Number} bitsFeature
 * @param {!Number} bitsVal
 * @param {!Number} candidateCount
 * @param {!Number} featureCount
 * @return {!{op: String, featureIdx: Number, valIdx: Number}} decoded candidate
 * @private
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
  return Object.values(index).reduce((c1, c2) => Math.max(c1, c2), 0) / (cs.length > 0 ? cs.length : 1);
}

/**
 * @param {*} label
 * @param {Array<*>} candidates
 * @return {!Number} confidence in prediction in [0, 1]
 * @private
 */
function confidence(label, candidates) {
  return candidates.filter(c => c.label === label).length / candidates.length;
}

class DecisionTree extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [minLeafItems]
   * @param {!Number} [minPurity]
   * @param {!Number} [maxDepth]
   * @param popSize
   * @param maxWaitSec
   * @param popGrowthFactor
   * @param mutationP
   * @param maxRounds
   */
  constructor(data, labels, r = 0.1, minLeafItems = 5, minPurity = 0.8, maxDepth = 15, popSize = 100, maxWaitSec = 5, popGrowthFactor = 2, mutationP = 0.8, maxRounds = 500) {
    super(data, labels, r);
    this.maxDepth = maxDepth;
    this.popSize = popSize;
    this.popGrowthFactor = popGrowthFactor;
    this.maxWaitSec = maxWaitSec;
    this.maxRounds = maxRounds;
    this.minLeafItems = minLeafItems;
    this.minPurity = minPurity;
  }

  fit() {
    this.tree = this._buildTree(
        this.dataTrain.map((val, idx) => ({val, label: this.labelsTrain[idx]})),
        this.maxDepth);
  }

  /**
   * @param {*} label
   * @return {!Number} support for prediction in [0, 1]
   * @private
   */
  _getSupport(label) {
    return this.dataTrain.filter((_, idx) => this.labelsTrain[idx] === label).length / this.dataTrain.length;
  }

  /**
   * Helper function to construct the tree.  Expects each candidate to be paired with a label.
   *
   * @param {Array<{label: *, val: *}>} candidates
   * @param {!Number} depthLimit
   * @return {{attr: *, op: !String, threshold: *, t: Object, f: Object}|{label: *, confidence: !Number, support: !Number, count: !Number}} tree
   * @private
   */
  _buildTree(candidates, depthLimit) {
    if (depthLimit <= 0 || candidates.length < this.minLeafItems) {
      const label = argMax(
          this.uniqueLabels,
          l => candidates.filter(c => c.label === l).length);
      if (depthLimit <= 0) console.log(`depth limit on label ${label}`);
      else console.log(`min children reached (#cands = ${candidates.length} | minLeafItems = ${this.minLeafItems})`);
      return {
        label,
        confidence: confidence(label, candidates),
        support: this._getSupport(label),
        count: candidates.length,
      };
    } else {
      const purityScore = purity(candidates);
      if (purityScore >= this.minPurity) {
        console.log(`pure on #candidates = ${candidates.length}`);
        const {label} = candidates[0];
        return {
          label,
          confidence: purityScore,
          support: this._getSupport(label),
          count: candidates.length,
        };
      }
    }

    const bitsFeature = Math.ceil(Math.log2(this.featureCount));
    const bitsVal = Math.ceil(Math.log2(candidates.length));

    const ga = new GA(
        makePopulation(this.popSize, bitsFeature, bitsVal),
        bits => fitnessF(decode(bits, bitsFeature, bitsVal, candidates.length, this.featureCount), candidates, this.minLeafItems),
        this.maxRounds, this.maxWaitSec, this.mutationP, this.popGrowthFactor, 3, 0.5, Math.floor(this.popSize * 0.1));

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
  predict(x) {
    return walkPredict(this.tree, x);
  }

  /**
   * Programmatic interface to rules.
   *
   * @return {Array<Object>} rules
   */
  get rules() {
    return collectRules(this.tree);
  }

  /**
   * Rules in plain english.
   *
   * @return {Array<String>} rules
   */
  get rulesEng() {
    return this.rules.map(ruleArr => {
      let s = 'IF ';
      for (const rule of ruleArr) {
        if (rule.label) {
          s += `THEN ${rule.label} (conf = ${rule.confidence.toPrecision(2)} from ${rule.count}/${this.dataTrain.length} examples)`;
        } else if (s === 'IF ') {
          s += `attr nr. ${rule.attr} ${rule.op === 'lt' ? '<' : '>='} ${rule.threshold} `;
        } else {
          s += `AND attr nr. ${rule.attr} ${rule.op === 'lt' ? '<' : '>='} ${rule.threshold} `;
        }
      }
      return s;
    });
  }

  toString() {
    return `${this.constructor.name} { leafItems = ${this.minLeafItems}, minPurity = ${this.minPurity}, maxDepth = ${this.maxDepth} }`;
  }
}

module.exports = DecisionTree;
