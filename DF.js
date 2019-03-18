const {readCSV} = require('./utils/data');
const {toTypedArray, transpose: t} = require('./utils');
const {mean, variance, mad, median, nQuart} = require('./utils/stats');
const fs = require('fs');
const zlib = require("zlib");
const {readdirSync, existsSync, writeFileSync, readFileSync} = require('fs');
const {shuffle} = require('./utils');
const {dirname, join} = require('path') ;
const log = require("./utils/log");

class DF {
  /**
   * @param {DF|Object<Array<*>>|Array<*>|Array<Array<*>>} data
   * @param {'cols'|'rows'|'dict'} [what]
   * @param {?Array<!String>} [colNames]
   */
  constructor(data = [], what = 'rows', colNames = null) {
    // accept data in 3 modes:
    // - list of columns Array<Array<*>>,
    // - list of rows <Array<Array<*>>,
    // - Object<*, Array<*>> (dict key => col)
    // - a DF (just clone it)
    if (data.length === 0) {
      this._cols = [];
      this.colNames = [];
    } else if (data.constructor.name === this.constructor.name) {
      this._cols = [].concat(data._cols);
      this.colNames = [].concat(data.colNames)
    } else if (data.constructor.name === 'Object' || what === 'dict') {
      this._cols = Object.values(data).map(toTypedArray);
      this.colNames = Object.keys(data);
    } else {
      this._cols = what === 'rows' ? t(data).map(toTypedArray) : data.map(toTypedArray);
      this.colNames  = colNames ? colNames : Array(this.nCols).fill(0).map((_, idx) => idx);
    }

    const attrNames = new Set(this.colNames);
    // index using cols integers AND column names
    Array(this.nCols).fill(0).map((_, idx) => attrNames.add(idx));

    // easy access e.g. df.age, df.salary
    for (const name of attrNames) {
      Object.defineProperty(this, name, { get: function () { return this.col(name); } });
    }

    function* iterator () {
      for (let r = 0; r < this.length; r++) {
        yield this.row(r);
      }
    }

    // make this.rowIter a getter
    Object.defineProperty(this, 'rowIter', {get: iterator});
    this[Symbol.iterator] = iterator;
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {!Number} column index
   * @private
   */
  _resolveCol(nameOrIdx) {
    if (nameOrIdx.constructor.name === 'String') {
      return this.colNames.findIndex(c => c === nameOrIdx);
    } else if (nameOrIdx < 0) {
      return this._resolveCol(this.nCols + nameOrIdx);
    } else return nameOrIdx;
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {Array<String>|TypedArray} column
   */
  col(nameOrIdx) {
    return this._cols[this._resolveCol(nameOrIdx)];
  }

  /**
   * @param {!Number} idx
   * @return {!Array<*>} row
   */
  row(idx) {
    return Array(this.nCols)
      .fill(0)
      .map((_, colIdx) => this.val(colIdx, idx));
  }

  /**
   * @return {!Number|!String} selects a val
   */
  val(col, idx) {
    return this.col(col)[idx];
  }

  /**
   * @param {!DF} other
   * @return {!DF} data frame
   */
  appendDF(other) {
    const cols = [].concat(this._cols);
    const colNames = [].concat(this.colNames);
    for (let c = 0; c < cols.length; c++) {
      if (cols[c].constructor.name === 'Array') {
        cols[c] = cols[c].concat(other.col(c));
      } else {
        const buf = new ArrayBuffer(cols[c].buffer.byteLength + other.col(c).buffer.byteLength);
        let view;
        if (other._cols[c].BYTES_PER_ELEMENT >= cols[c].BYTES_PER_ELEMENT) {
          view = new (other.col(c).constructor)(buf);
        } else {
          view = new (cols[c].constructor)(buf);
        }
        view.set(cols[c]);
        view.set(other.col(c), cols[c].length);
        cols[c] = view;
      }
    }
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!Number|!String} col
   * @param {!Function} f
   * @param {!Function} [f2]
   * @return {!DF} data frame
   */
  mapCol(col, f, f2 = toTypedArray) {
    const colIdx = this._resolveCol(col);
    const cols = [].concat(this._cols);
    cols[colIdx] = toTypedArray(cols[colIdx].map(f));
    return new DF(cols, 'cols', this.colNames);
  }

  /**
   * @param {!Array<!String>|!Array<!Number>} col
   * @param {?String} [colName]
   * @return {!DF} data frame
   */
  appendCol(col, colName = null) {
    const cols = [].concat(this._cols);
    const colNames = [].concat(this.colNames);
    cols.push(toTypedArray(col));
    colNames.push(colNames ? colNames : cols.length - 1);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!DF} other other data frame
   * @return {!DF} data frame
   */
  mergeDF(other) {
    const isDigit = /^\d+$/; // check if has proper column names or just indexes
    let colNames;

    // if columns are indexes, shift them
    if (other.colNames.filter(c => c.toString().match(isDigit)).length === other.colNames.length) {
      colNames = this.colNames.concat(other.colNames.map(cIdx => this.colNames.length + cIdx));
    } else {
      colNames = this.colNames.concat(other.colNames);
    }

    const cols = this._cols.concat(other._cols);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {...<!Number|!String>} columns
   * @return {!DF} data frame
   */
  select(...columns) {
    const cols = [];
    const colNames = [];
    for (const i of Array.from(new Set(columns)).map(c => this._resolveCol(c))) {
      cols.push(this._cols[i]);
      colNames.push(this.colNames[i]);
    }
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @return {!Number} number of rows
   */
  get length() {
    return this._cols[0].length;
  }

  /**
   * @return {!Number} number of columns
   */
  get nCols() {
    return this._cols.length;
  }

  /**
   * @return {{rows: !Number, cols: !Number}}
   */
  get dim() {
    return {rows: this.length, cols: this.nCols};
  }

  /**
   * @param {...!String} cols
   * @return {!Array<!String>|!String} data type for the column
   */
  dtype(...cols) {
    if (cols.length === 1) {
      const t = this._cols[this._resolveCol(cols[0])].constructor.name;
      if (t === 'Array') {
        return 'Array';
      } else {
        return t.replace('Array', '');
      }
    } else if (cols.length === 0) {
      return this.dtypes;
    } else {
      return cols.map(c => this.dtype(c));
    }
  }

  /**
   * @return {!Array<!String>} data types for all columns
   */
  get dtypes() {
    return this._cols.map(c =>
      c.constructor.name === 'Array'
        ? 'String'
        : c.constructor.name.replace('Array', ''));
  }

  /**
   * @return {{total: !Number, cols: Object<!Number>}} memory info
   */
  get memory() {
    const memInfo = {
      total: this._cols
        .map(c =>
          c.constructor.name === 'Array'
            ? mean(c.map(s => s.length)) // assume 1 byte / char for string cols
            : c.byteLength)
        .reduce((v1, v2) => v1 + v2, 0), // sum
      cols: {},
    };
    for (let colName of this.colNames) {
      const colIdx = this._resolveCol(colName);
      if (this._cols[colIdx].constructor.name === 'Array') {
        memInfo.cols[colName] = this._cols[colIdx].map(s => s.length).reduce((left, right) => left + right, 0);
      } else {
        memInfo.cols[colName] = this._cols[colIdx].byteLength;
      }
    }
    return memInfo;
  }

  /**
   * @return {!DF} data frame
   */
  get head() {
    return this.slice(0, 25);
  }

  /**
   * @return {!DF} data frame
   */
  get tail() {
    return this.slice(this.length - 25, this.length);
  }

  /**
   * @return {!DF} reversed version of the data frame
   */
  reversed(axis = 'cols') {
    if (axis === 'cols') {
      const cols = [].concat(this._cols).reverse();
      const colNames = [].concat(this.colNames).reverse();
      return new DF(cols, 'cols', colNames);
    }
    // reverse rows
    const cols = [];
    for (let c = 0; c < this.nCols; c++) {
      cols.push([].concat(this._cols[c]).reverse());
    }
    const colNames = [].concat(this.colNames);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {...<!String|!Number>} cols col pairs
   */
  sliceCols(...cols) {
    if (cols.length === 0) {
      return this;
    } else if (cols.length % 2 !== 0) {
      cols.push(this.nCols);
    }

    const colIds = new Set();

    for (let i = 1; i < cols.length; i+=2) {
      const min = this._resolveCol(cols[i - 1]);
      const max = this._resolveCol(cols[i]);
      for (let c = min; c < max; c++) {
        colIds.add(c)
      }
    }

    return this.select(...colIds);
  }

  /**
   * @param {...!Number} idxs pairs of indexes
   * @return {!DF} a data frame
   */
  slice(...idxs) {
    if (idxs.length === 0) {
      return this;
    } else if (idxs.length === 1) {
      return this.slice(idxs[0], this.length);
    } else if (idxs.length % 2 !== 0) {
      idxs.push(this.length);
    }

    const cols = Array(this.nCols).fill(0).map(_ => []);

    // for every pair of indexes
    for (let i = 1; i < idxs.length; i+=2) {
      const min = idxs[i - 1];
      const max = idxs[i];
      for (let colIdx = 0; colIdx < this.nCols; colIdx++) {
        for (let rowIdx = min; rowIdx < max; rowIdx++) {
          cols[colIdx].push(this.val(colIdx, rowIdx));
        }
      }
    }

    return new DF(cols, 'cols', [].concat(this.colNames));
  }

  /**
   * @param {!Number|!String} col
   * @param {'asc'|'desc'} ord
   * @return {DF}
   */
  orderBy(col, ord = 'asc') {
    const colIdx = this._resolveCol(col);
    let rows;
    if (ord.match(/^\s*asc/i)) {
       rows = Array.from(this.rowIter).sort((r1, r2) => {
         if (r1[colIdx] > r2[colIdx]) return 1;
         if (r1[colIdx] < r2[colIdx]) return -1;
         return 0;
       });
    } else {
       rows = Array.from(this.rowIter).sort((r1, r2) => {
         if (r1[colIdx] < r2[colIdx]) return 1;
         if (r1[colIdx] > r2[colIdx]) return -1;
         return 0;
       });
    }
    return new DF(rows, 'rows', this.colNames);
  }

  /**
   * @param {...<!String|!Number>} nameOrIdxs
   * @return {!DF} data frame
   */
  drop(...nameOrIdxs) {
    const toDelete = nameOrIdxs.map(id => this._resolveCol(id));
    const cols = [];
    const colNames = [];
    const neededCols = this.colNames
      .map((_, idx) => idx)
      .filter(colIdx => toDelete.indexOf(colIdx) < 0);
    for (let cIdx of neededCols) {
      cols.push(this._cols[cIdx]);
      colNames.push(this.colNames[cIdx]);
    }
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!Function} f predicate (row => Boolean)
   * @return {!DF} data frame
   */
  filter(f = (_row, _idx) => true) {
    return new DF(
      Array.from(this.rowIter).filter(f),
      'rows',
      this.colNames,
    );
  }

  /**
   * Shuffle the data frame.
   *
   * @return {!DF} data frame with shuffled rows
   */
  shuffle() {
    const rows = Array.from(this.rowIter);
    shuffle(rows);
    return new DF(rows, 'rows', this.colNames);
  }

  groupBy(col, f = rows => mean(rows), colName = 'AggregateFunction') {
    const colIdx = this._resolveCol(col);
    const index = {};
    for (let r of this.rowIter) {
      const val = r[colIdx];
      const row = r.slice(0, colIdx).concat(r.slice(colIdx + 1));
      if (index[val] === undefined) {
        index[val] = [row];
      } else {
        index[val].push(row);
      }
    }
    for (let k of Object.keys(index)) {
      index[k] = f(index[k]);
    }
    return new DF(Object.entries(index), 'rows', [this.colNames[colIdx], colName]);
  }

  /**
   * Summaries each column.
   *
   * @return {DF} data frame
   */
  get summary() {
    const info = {
      column: [],
      min: [], max: [], range: [],
      mean: [],
      stdev: [], variance: [], mad: [],
      Q1: [], median: [], Q3: [],
      dtype: [],
    };
    for (let c = 0; c < this.nCols; c++) {
      const dtype = this.dtypes[c];
      const name = this.colNames[c];
      if (dtype === 'String') {
        for (const k in info) info[k].push('nan');
        info.column[info.column.length - 1] = name;
        info.dtype[info.dtype.length - 1] = dtype;
        continue
      }
      const col = this._cols[c];
      const min = col.reduce((v1, v2) => Math.min(v1, v2));
      const max = col.reduce((v1, v2) => Math.max(v1, v2));
      const v = variance(col);
      info.column.push(name);
      info.mean.push(mean(col));
      info.dtype.push(dtype);
      info.variance.push(v);
      info.stdev.push(Math.sqrt(v));
      info.Q1.push(nQuart(col, 1, 4));
      info.median.push(median(col));
      info.Q3.push(nQuart(col, 3, 4));
      info.min.push(min);
      info.max.push(max);
      info.mad.push(mad(col));
      info.range.push(max - min);
    }
    return new DF(info);
  }

  /**
   * @return {!Object<Array<!Number>|!Array<!String>>} dictionary
   */
  toDict() {
    const dict = {};
    for (let cIdx = 0; cIdx < this.nCols; cIdx++) {
      const cName = this.colNames[cIdx]
      const col = this._cols[cIdx];
      dict[cName] = Array.from(col);
    }
    return dict;
  }

  /**
   * @return {!Array<Array<*>>} rows or cols as array
   */
  toArray(mode = 'rows') {
    return mode === 'rows'
      ? Array.from(this.rowIter)
      : this._cols.map(c => Array.from(c));
  }

  /**
   * @return {!String} json-stringified data frame
   */
  toJSON() {
    return JSON.stringify(this.toDict());
  }

  /**
   * @param {!String} fileName
   * @return {!Promise<*>}
   */
  toFile(fileName) {
    if (!fileName.endsWith('.df')) {
      log.warn('not a "*.df" file name');
    }
    const parent = dirname(fileName);
    if (!existsSync(parent)) {
      fs.mkdirSync(parent);
    }
    return writeFileSync(fileName, zlib.gzipSync(this.toJSON()), { flag: 'w' });
  }

  /**
   * @param {?Number} [n]
   * @param {?Number} [m]
   */
  print(n = null, m = null) {
    if (n === null) return this.print(Math.min(25, process.stdout.rows - 1));
    else if (m === null) return this.print(0, n);
    const table = Array.from(this.rowIter)
      .splice(n, m)
      .map(row => {
        const dict = {};
        for (let v = 0; v < row.length; v++) {
          dict[this.colNames[v]] = row[v];
        }
        return dict;
      });
    console.table(table);
  }

  /**
   * @return {!DF} shallow copy of the data frame
   */
  copy() {
    return new DF([].concat(this._cols), 'cols', [].concat(this.colNames));
  }

  /**
   * @return {!DF} clone (deep copy) of the data frame
   */
  clone() {
    const newCols = [];
    for (let cIdx = 0; cIdx < this.nCols; cIdx++) {
      const col = this._cols[cIdx];
      if (col.constructor.name === 'Array') {
        newCols.push([].concat(col));
      } else {
        const newBuf = new ArrayBuffer(col.byteLength);
        const newTypedArr = new col.constructor(newBuf);
        newTypedArr.set(col);
        newCols.push(newTypedArr);
      }
    }
    return new DF(newCols, 'cols', [].concat(this.colNames));
  }

  /**
   * @param {!String} filePath
   * @param {?Boolean} [hasHeader]
   * @param {?Array<!String>} colNames
   * @return {!DF} data frame
   */
  static fromCSV(filePath, hasHeader = true, colNames = null) {
    const rows = readCSV(filePath, false); // assume for now it doesn't
    const maybeHeader = hasHeader ? rows[0] : null;
    const cols = t(hasHeader ? rows.splice(1) : rows);
    const isNum = /^(\d+\.?\d*|\d*\.\d+)$/g;
    for (let c = 0; c < cols.length; c++) {
      if (!cols[c].find(val => !val.match(isNum))) {
        cols[c] = cols[c].map(parseFloat)
      }
    }
    return new DF(cols, 'cols', maybeHeader);
  }

  /**
   * @param {!String} filePath
   * @return {!DF}
   */
  static fromFile(filePath) {
    if (!existsSync(filePath) && existsSync(`${filePath}.df`)) {
      return DF.fromFile(`${filePath}.df`);
    }
    const json =  JSON.parse(zlib.gunzipSync(readFileSync(filePath)).toString('utf-8'));
    const colNames = Object.keys(json);
    const isIndexed = colNames.map(nm => !!nm.match(/^\d+$/)).reduce((l, r) => l && r, true);
    return new DF(
      Object.values(json),
      'cols',
      isIndexed ? colNames.map(parseFloat) : colNames);
  }

  /**
   * @param {!String} name
   * @param {?Boolean} hasHeader
   * @param {?Array<!String>} colNames
   * @return {!DF} data frame
   */
  static loadDataSet(name = 'iris', hasHeader = true, colNames = null) {
    return DF.fromCSV(`${dirname(__filename)}/datasets/${name}/${name}.csv`, hasHeader, colNames);
  }

  /**
   * @return {!String}
   */
  static get dataSetsPath() {
    return join(dirname(__filename), 'datasets');
  }

  /**
   * @return {!Array<!String>} datasets
   */
  static get dataSets() {
    return readdirSync(DF.dataSetsPath).filter(node => !node.match(/\.w+$/));
  }

  toString() {
    return `${this.constructor.name} ${this.nCols}x${this.length} { ${this.dtypes.map((dt, idx) => `${this.colNames[idx]}  ${dt}`).join(', ')} }`;
  }
}

module.exports = DF;
