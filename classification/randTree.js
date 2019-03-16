const { Classifier } = require('.');
const { argMax } = require('../utils');
const GA = require('../search/genetic');
const { randInRange, randBitStr } = require('../utils/random');
const log = require('../utils/log');


class RandTree extends Classifier {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {?Number} [minLeafItems]
   * @param {?Number} [minPurity]
   * @param {?Number} [maxDepth]
   * @param {?Number} [popSize]
   * @param {?Number} [maxWaitSec]
   * @param {?Number} [popGrowthFactor]
   * @param {?Number} [mutationP]
   * @param {?Number} [maxRounds]
   */
  constructor(
    data,
    labels,
    r = 0.125,
    minLeafItems = null,
    minPurity = null,
    maxDepth = null,
    popSize = null,
    maxWaitSec = null,
    popGrowthFactor = null,
    mutationP = null,
    maxRounds = null,
  ) {
    super(data, labels, r);
    this.maxDepth = maxDepth === null ? this.featureCount : maxDepth;
    this.popSize = popSize === null ? Math.floor(randInRange(50, 200)) : popSize;
    this.popGrowthFactor = popGrowthFactor === null ? randInRange(1.75, 3.5) : popGrowthFactor;
    this.maxWaitSec = maxWaitSec === null ? Math.max(2, Math.floor((180 / this.featureCount))) : maxWaitSec;
    this.mutationP = mutationP === null ? randInRange(0.75, 1) : mutationP;
    this.maxRounds = maxRounds === null ? Math.floor(randInRange(50, 150)) : maxRounds;
    this.minLeafItems = minLeafItems === null ? Math.floor(randInRange(Math.max(3, this.dataTrainCount * 0.01), Math.max(7, this.dataTrainCount * 0.02))) : minLeafItems;
    this.minPurity = minPurity === null ? randInRange(0.75, 0.95) : minPurity;
  }

  fit() {
    this.tree = this._buildTree(
      Array.from(this.dataTrain.rowIter).map((val, idx) => ({ val, label: this.labelsTrain[idx] })),
      this.maxDepth,
    );
  }

  /**
   * @param {!Array<{label: *}>} cs
   * @returns {!number} purity ratio [0, 1]
   */
  _purity(cs) {
    if (cs.length === 0) return 0;
    const index = {};
    for (let c = 0; c < cs.length; c++) {
      index[cs[c].label] = (index[cs[c].label] || 0) + 1;
    }
    return Object.values(index).reduce((c1, c2) => Math.max(c1, c2)) / cs.length;
  }

  /**
   * @param {*} label
   * @returns {!number} support for prediction in [0, 1]
   * @private
   */
  _support(label) {
    return this.labelsTrain.filter(l => l === label).length / this.dataTrainCount;
  }

  /**
   * @param {*} label
   * @param {Array<*>} candidates
   * @returns {!number} confidence in prediction in [0, 1]
   * @private
   */
  static _confidence(label, candidates) {
    return candidates.length === 0
      ? 0
      : candidates.filter(c => c.label === label).length / candidates.length;
  }

  /**
   * @param {!string} bits
   * @param {!number} bitsFeature
   * @param {!number} bitsVal
   * @param {!number} candidateCount
   * @returns {!{opName: String, opF: Function, attrIdx: Number, valIdx: Number}} decoded candidate
   * @private
   */
  static _decode(bits, bitsFeature, bitsVal, candidateCount) {
    const opName = bits[bitsFeature] === '0' ? 'gte' : 'lt';
    return {
      attrIdx: eval(`0b${bits.slice(0, bitsFeature)}`),
      opF: opName === 'gte' ? (a, b) => a >= b : (a, b) => a < b,
      opName,
      valIdx: eval(`0b${bits.slice(bitsFeature + 1)}`),
    };
  }

  /**
   * @param {!number} attrIdx
   * @param {!string} opName "gte" or "lt"
   * @param {!number} valIdx
   * @param {!Function} opF operator function
   * @param {!Array<{val: *, label: *}>} candidates
   * @param {!Number} [minLeafItems]
   * @returns {!Number} fitness score
   * @private
   */
  _fitnessF({ attrIdx, opName, valIdx, opF }, candidates, minLeafItems = 6) {
    const val = candidates[valIdx].val[attrIdx];
    const t = [];
    const f = [];
    for (let c = 0; c < candidates.length; c++) {
      (opF(candidates[c], val) ? t : f).push(c);
    }

    let fitness = 0;

    /*
     * FACTOR #1
     * penalise if the split between f and t IS NOT equal
     * the cost is the offset from the difference from candidates.length / 2
     */
    const half = candidates.length / 2;
    const offsetFromHalf = Math.abs(t.length - half);
    if (offsetFromHalf === 0) fitness += 1;
    else fitness -= offsetFromHalf / half;

    /*
     * FACTOR #2
     * penalise if too few items in each bin
     * focus on the smaller bin
     */
    fitness += Math.min(1, (Math.min(t.length, f.length) - this.minLeafItems) / this.minLeafItems);

    /*
     * FACTOR #3
     * penalise if *one* of the bins is not highly homogeneous (pure)
     * this is the most important factor
     */
    fitness -= (1 - Math.max(this._purity(t), this._purity(f))) * 3.5;

    return fitness;
  }

  /**
   * Helper function to construct the tree.  Expects each candidate to be paired with a label.
   *
   * @param {Array<{label: *, val: *}>} candidates
   * @param {!number} depthLimit
   * @returns {?{attrIdx: *, opName: !String, threshold: *, t: Object, f: Object}|?{label: *, confidence: !Number, support: !Number, count: !Number}} tree
   * @private
   */
  _buildTree(candidates, depthLimit) {
    if (candidates.length === 0) return null;
    else if (depthLimit <= 0 || candidates.length < this.minLeafItems) {
      const label = argMax(
        this.uniqueLabels,
        l => candidates.filter(c => c.label === l).length,
      );
      if (depthLimit <= 0) log.debug(`depth limit on label ${label}`);
      else log.debug(`min children reached [${candidates.length}/${this.minLeafItems}]`);
      return {
        label,
        confidence: RandTree._confidence(label, candidates),
        support: this._support(label),
        count: candidates.length,
      };
    } else {
      const purityScore = this._purity(candidates);
      if (purityScore >= this.minPurity) {
        log.debug(`pure on #candidates = ${candidates.length}`);
        const { label } = candidates[0];
        return {
          label,
          confidence: purityScore,
          support: this._support(label),
          count: candidates.length,
        };
      }
    }

    const bitsFeature = Math.floor(Math.log2(this.featureCount));
    const bitsVal = Math.floor(Math.log2(candidates.length));

    const ga = new GA(
      bits => this._fitnessF(RandTree._decode(bits, bitsFeature, bitsVal, candidates.length), candidates),
      100,
      bitsFeature +  bitsVal + 1,
      this.maxRounds,
      this.maxWaitSec,
      this.mutationP,
      this.popGrowthFactor,
      5,
      0.5,
      Math.floor(this.popSize * 0.1),
    );

    const { attrIdx, opName, valIdx, opF } = RandTree._decode(ga.search()[0], bitsFeature, bitsVal, candidates.length);

    const val = candidates[valIdx].val[attrIdx];

    const t = [];
    const f = [];

    for (let c = 0; c < candidates.length; c++) {
      (opF(candidates[c].val[attrIdx], val) ? t : f).push(candidates[c]);
    }

    return {
      attrIdx,
      threshold: candidates[valIdx].val[attrIdx],
      opName,
      t: this._buildTree(t, depthLimit - 1),
      f: this._buildTree(f, depthLimit - 1),
    };
  }

  /**
   * @param {Array<*>} x
   */
  predict(x) {
    /**
     * @param {{threshold: number, attrIdx: number, t: Object, f: Object, opName: string, support: number, confidence: number, label: *}} node
     * @param {*} x
     * @returns {*}
     * @private
     */
    function walkPredict(node, x) {
      if (node === null) return null;
      else if (node.confidence) return node.label;
      const { attrIdx, t, f, opName, threshold } = node;
      return walkPredict((opName === 'lt' ? (a, b) => a < b : (a, b) => a >= b)(x[attrIdx], threshold) ? t : f, x);
    }
    return walkPredict(this.tree, x);
  }

  /**
   * Programmatic interface to rules.
   *
   * @returns {Array<Object>} rules
   */
  get rules() {
    /**
     * @param {{label: *, confidence: !number, support: !number, count: !number}|{attrIdx: *, opName: !string, threshold: *, t: Object, f: Object}} node
     * @returns {Array<Array<{label: *, confidence: !number, support: !number, count: !number}|{attrIdx: *, opName: !string, threshold: *}>>} rules
     * @private
     */
    function collectRules(node) {
      if (node === null) return [];
      else if (node.label) return [[node]];
      const { attrIdx, threshold, t, f, opName } = node;
      return [t, f].map(subTree => collectRules(subTree)) // [rules from left sub-tree, r. f. r. subtree]
        .reduce((l, r) => l.concat(r)) // flatten
        .map(rule => [{ attrIdx, opName, threshold }].concat(rule)); // prepend
    }
    return collectRules(this.tree);
  }

  /**
   * Rules in plain english.
   *
   * @returns {Array<string>} rules
   */
  get rulesEng() {
    return this.rules.map((ruleArr) => {
      const stack = ['IF '];
      for (const rule of ruleArr) {
        if (rule.label) {
          stack.push(`THEN ${rule.label} (conf = ${rule.confidence.toPrecision(2)} from ${rule.count}/${this.dataTrainCount} examples)`);
        } else if (stack[stack.length - 1] === 'IF ') {
          stack.push(`attr nr. ${rule.attrIdx} ${rule.opName === 'lt' ? '<' : '>='} ${rule.threshold} `);
        } else stack.push(`AND attr nr. ${rule.attrIdx} ${rule.opName === 'lt' ? '<' : '>='} ${rule.threshold} `);
      }
      if (stack.length === 2) stack[0] = 'ASSUME ';
      return stack.join('');
    });
  }

  /**
   * @returns {!number} height
   */
  get treeHeight() {
    /**
     * @param {!{t: Object, f: Object}} t
     * @returns {!number} height
     */
    function h(t) {
      return t === null || t === undefined ? 0 : 1 + Math.max(h(t.f), h(t.t));
    }
    return h(this.tree);
  }

  toString() {
    return `${this.constructor.name} { ${this.tree !== undefined ? 'acc = ' + this.score().toPrecision(2) + ', ' : ''}height = ${this.treeHeight}/${this.maxDepth}, #data = ${this.dataTrainCount}, leafItems = ${this.minLeafItems}, minPurity = ${this.minPurity.toPrecision(2)} }`;
  }
}

module.exports = RandTree;
