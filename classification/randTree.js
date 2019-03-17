const { Classifier } = require('.');
const { argMax, bag } = require('../utils');
const { randInRange, randNArrEls } = require('../utils/random');
const log = require('../utils/log');


class RandTree extends Classifier {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {?Number} [minLeafItems]
   * @param {?Number} [minPurity]
   * @param {?Number} [maxDepth]
   * @param {!Number} [maxCheckVals]
   * @param {!Number} [purityWeight]
   * @param {!Number} [leafItemWeight]
   * @param {!Number} [splitWeight]
   *
   * NOTE the purityWeight, leafItemWeight, splitWeight, maxCheckVals, minLeafItems and minPurity default values were generated using a
   *      genetic algorithm so it's probably as good as it's going to get (you don't need to weak it).
   */
  constructor(data, labels, r = 0.125, minLeafItems = null, minPurity = null, maxDepth = null, maxCheckVals = 82, purityWeight = 3.238, leafItemWeight = 6.218, splitWeight = 6.15) {
    super(data, labels, r);
    this.maxDepth = maxDepth === null ? this.data.nCols : maxDepth;
    this.purityWeight = purityWeight;
    this.splitWeight = splitWeight;
    this.leafItemWeight = leafItemWeight;
    this.minLeafItems = minLeafItems === null
      ? Math.floor(
          randInRange(
            Math.max(4, this.dataTrainCount * 0.008),
            Math.max(8, this.dataTrainCount * 0.014)))
      : minLeafItems;
    this.minPurity = minPurity === null ? randInRange(0.78, 0.85) : minPurity;
    this.maxCheckVals = maxCheckVals;
    this._dataTrainCache = this.dataTrain;
    this.tree = null;
    this.support = {};
    for (let l of this.uniqueLabels) {
      this.support[l] = this.labelsTrain.filter(lt => l === lt).length / this.labelsTrain.length;
    }
  }

  /**
   * Build a tree.
   */
  fit() {
    const rowIdxs = Array(this._dataTrainCache.length).fill(0).map((_, idx) => idx);
    const attrIdxs = new Set(Array(this._dataTrainCache.nCols).fill(0).map((_, idx) => idx));
    this.tree = this._buildTree(rowIdxs, this.maxDepth, attrIdxs);
  }

  /**
   * @param {!Array<!Number>} rowIdxs
   * @returns {!Number} purity ratio [0, 1]
   */
  _purity(rowIdxs) {
    if (rowIdxs.length === 0) return 0;
    const multiset = bag(rowIdxs.map(row => this.labelsTrain[row]));
    const bestLabelFreq = Object.values(multiset).reduce((c1, c2) => Math.max(c1, c2));
    return  bestLabelFreq / rowIdxs.length;
  }

  /**
   * @param {*} label
   * @param {Array<!Number>} rowIdxs
   * @returns {!Number} confidence in prediction in [0, 1]
   * @private
   */
  _confidence(label, rowIdxs) {
    return rowIdxs.length === 0
      ? 0
      : rowIdxs.filter(c => this.labelsTrain[c] === label).length / rowIdxs.length;
  }

  /**
   * @param {!Number} attrIdx
   * @param {!Number} valIdx
   * @param {!Array<!Number>} rowIdxs
   * @returns {{total: !Number, split: !Number, purity: !Number, leafItems: !Number}} score
   * @private
   */
  _scoreSplit(attrIdx, valIdx, rowIdxs) {
    const val = this._dataTrainCache.val(attrIdx, valIdx);
    const lt = [];
    const gte = [];
    for (const row of rowIdxs) {
      if (this._dataTrainCache.val(attrIdx, row) >= val) {
        gte.push(row);
      } else {
        lt.push(row);
      }
    }

    /* FACTOR #1
     * penalise if the split between f and t IS NOT equal
     * the cost is the offset from the difference from candidates.length / 2 */
    let scoreSplit = 0;
    const half = rowIdxs.length / 2;
    const offsetFromHalf = Math.abs(gte.length - half);
    if (offsetFromHalf === 0) {
      scoreSplit = 1;
    } else {
      scoreSplit = -(offsetFromHalf / half) * this.splitWeight;
    }

    /* FACTOR #2
     * penalise if too few items in each bin
     * focus on the smaller bin */
    const scoreLeafItems = Math.min(
      1,
      (Math.min(gte.length, lt.length) - this.minLeafItems) / this.minLeafItems * this.leafItemWeight);

    /* FACTOR #3
     * penalise if *one* of the bins is not highly homogeneous (pure)
     * this is the most important factor */
    const scorePurity = Math.max(this._purity(gte), this._purity(lt)) * this.purityWeight;

    return {
      total: scoreSplit + scorePurity + scoreLeafItems,
      leafItems: scoreLeafItems,
      purity: scorePurity,
      split: scoreSplit,
    };
  }

  /**
   * @param {!Array<!Number>} rowIdxs
   * @param {!Number} depthLimit
   * @param {!Set<!Number>} unUsedAttrs
   * @returns {?{attrIdx: *, threshold: *, lt: Object, gte: Object}|?{label: *, confidence: !Number, support: !Number, count: !Number}} tree
   * @private
   */
  _buildTree(rowIdxs, depthLimit, unUsedAttrs) {
    if (rowIdxs.length === 0) return null;

    const bestLabel = argMax(
      this.uniqueLabels,
      l => rowIdxs.filter(c => this.labelsTrain[c] === l).length,
    );

    const confidence = this._confidence(bestLabel, rowIdxs);
    const support = this.support[bestLabel];
    const count = rowIdxs.length;
    let isDone = false;

    if (unUsedAttrs.size === 0) {
      isDone = true;
      log.debug(`split on all attrs`);
    } else if (depthLimit <= 0) {
      isDone = true;
      log.debug(`depth limit`);
    } else if ((count / 2) < this.minLeafItems ) {
      isDone = true;
      log.debug(`min children reached`);
    } else if (confidence >= this.minPurity) {
      isDone = true;
      log.debug(`pure`);
    }

    if (isDone) {
      log.debug(`#leafItems = ${count}/${this.minLeafItems}`);
      log.debug(`purity = ${confidence.toPrecision(2)}`);
      log.debug(`depth = ${depthLimit}/${this.maxDepth}`);
      log.debug(`#attrs = ${unUsedAttrs.size}/${this._dataTrainCache.nCols}`);
      return { label: bestLabel, confidence, support, count };
    }

    const {attrIdx, valIdx, score} = this._bestSplit(rowIdxs, unUsedAttrs);

    const nextLvlAttrs = new Set(unUsedAttrs);
    nextLvlAttrs.delete(attrIdx);

    const threshold = this._dataTrainCache.val(attrIdx, valIdx);

    const gte = [];
    const lt = [];

    for (const c of rowIdxs) {
      if (this._dataTrainCache.val(attrIdx, c) >= threshold) {
        gte.push(c)
      } else
        lt.push(c);
    }

    log.debug(`splitting ${rowIdxs.length} items on ${this._dataTrainCache.colNames[attrIdx]} >= ${this._dataTrainCache.val(attrIdx, valIdx).constructor.name === 'Number' ? this._dataTrainCache.val(attrIdx, valIdx).toPrecision(2) : this._dataTrainCache.val(attrIdx, valIdx) }, #gte = ${gte.length}, #lt = ${lt.length}, purity = ${score.purity.toPrecision(2)} (${(score.purity / 6).toPrecision(2)} * 6), split = ${score.split.toPrecision(2)}, total = ${score.total.toPrecision(2)}, leafItems = ${score.leafItems.toPrecision(2)}`);

    return {
      attrIdx,
      threshold,
      score,
      gte: this._buildTree(gte, depthLimit - 1, nextLvlAttrs),
      lt: this._buildTree(lt, depthLimit - 1, nextLvlAttrs),
    };
  }

  /**
   * @param {Array<!Number>} rowIdxs
   * @param {!Set<!Number>} unUsedAttrs
   * @return {{attrIdx: !Number, valIdx: !Number, score: {purity: !Number, total: !Number, leafItems: !Number}}} info
   * @private
   */
  _bestSplit(rowIdxs, unUsedAttrs) {

    const rules = [];

    for (let attrIdx of unUsedAttrs) {
      const noExamples = Math.min(rowIdxs.length, this.maxCheckVals);
      const sample = randNArrEls(rowIdxs, noExamples);
      for (const valIdx of sample) {
        const score = this._scoreSplit(attrIdx, valIdx, rowIdxs);
        rules.push({ attrIdx, valIdx, score });
      }
    }

    return argMax(rules, r => r.score.total);
  }

  /**
   * @param {Array<*>} row
   * @return {*} label
   */
  predict(row) {
    /**
     * @param {{label: *, confidence: !Number, support: !Number, count: !Number}|{threshold: number, attrIdx: number, lt: Object, gte: number, score: Object<Number>}} node
     * @param {*} row
     * @returns {*}
     * @private
     */
    function walkPredict(node, row) {
      if (node === null) {
        return null;
      } else if (node.label !== undefined){
        return node.label;
      }
      const { attrIdx, lt, gte, threshold } = node;
      return walkPredict(row[attrIdx] >= threshold ? gte : lt, row);
    }
    return walkPredict(this.tree, row);
  }

  /**
   * Programmatic interface to rules.
   *
   * @returns {Array<Object>} rules
   */
  get rules() {
    /**
     * @returns {!Array<!{label: *, confidence: !Number, support: !Number, count: !Number}|!{attrIdx: !Number, threshold: *}>} rules
     * @private
     */
    function collectRules(node) {
      if (node === null || node === undefined) return [];
      else if (node.label !== undefined) {
        return [[node]];
      }
      const { attrIdx, threshold, gte, lt } = node;
      const rules = [];
      if (lt !== null) {
        for (const r of collectRules(lt)) {
          r.unshift({attrIdx, threshold, op: '<'});
          rules.push(r);
        }
      }
      if (gte !== null) {
        for (const r of collectRules(gte)) {
          r.unshift({attrIdx, threshold, op: '>='});
          rules.push(r);
        }
      }
      return rules;
    }
    return collectRules(this.tree);
  }

  /**
   * Rules in plain english.
   *
   * @returns {!Array<!String>} rules
   */
  get rulesEng() {
    return this.rules.map((ruleArr) => {
      if (ruleArr.length === 1) {
        const r = ruleArr[0];
        return `ASSUME ${r.label} (conf = ${r.confidence.toPrecision(2)} from ${r.count}/${this.dataTrainCount} examples)`
      }

      const stack = ['IF '];

      const fstRule = ruleArr[0];
      const printNames = !this._dataTrainCache.colNames.some(c => c.toString().match(/^\d+$/))
      stack.push(`attr ${printNames ? '' : 'attr no. '}${this._dataTrainCache.colNames[fstRule.attrIdx]} ${fstRule.op} ${fstRule.threshold.constructor.name === 'Number' ? fstRule.threshold.toPrecision(2) : fstRule.threshold} `);

      for (const r of ruleArr.slice(1)) {
        // is leaf
        if (r.label !== undefined) {
          stack.push(`THEN ${r.label} (conf = ${r.confidence.toPrecision(2)} from ${r.count}/${this.dataTrainCount} examples)`);
        } else {
          stack.push(`AND ${printNames ? '' : 'attr no. '}${this._dataTrainCache.colNames[r.attrIdx]} ${r.op} ${r.threshold.constructor.name === 'Number' ? r.threshold.toPrecision(2) : r.threshold} `);
        }
      }

      return stack.join('');
    });
  }

  /**
   * @returns {!number} height
   */
  get treeHeight() {
    /**
     * @param {!{gte: Object, lt: Object}|!{label: *}} t
     * @returns {!number} height
     */
    function h(t) {
      return t === null ? 0 : t.label !== undefined  ? 1 : 1 + Math.max(h(t.lt), h(t.gte));
    }
    return h(this.tree);
  }

  toString() {
    return `${this.constructor.name} { ${this.tree !== undefined ? 'acc = ' + this.score.toPrecision(2) + ', ' : ''}height = ${this.treeHeight}/${this.maxDepth}, #data = ${this.dataTrainCount}, leafItems = ${this.minLeafItems}, minPurity = ${this.minPurity.toPrecision(2)} }`;
  }
}

module.exports = RandTree;
