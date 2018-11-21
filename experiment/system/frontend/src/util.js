import _ from 'lodash';
import * as d3 from 'd3-format';
const integerFormatter = d3.format(',')
const numberFormatter = d3.format(',.2f')

export function formatOption(v) {
  if (_.isString(v)) {
    return v;
  } else if (_.isInteger(v)) {
    return integerFormatter(v);
  } else if (_.isNumber(v)) {
    return numberFormatter(v);
  }
}

export function prettyFloat(n, floatingPoint = 5){
  let temp = Math.pow(10, floatingPoint)
  return Math.round( n * temp ) / temp;
}

export function isInt(n){
  return Number(n) === n && n % 1 === 0;
}

export function copy(o){
  return JSON.parse(JSON.stringify(o));
}

Array.prototype.contains = function(v, accessor) {
  accessor = accessor|| function(o){return o;};
  for(var i = 0; i < this.length; i++) {
    if(accessor(this[i]) === accessor(v)) return true;
  }
  return false;
};

Array.prototype.unique = function(accessor) {
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(!arr.contains(this[i], accessor)) {
      arr.push(this[i]);
    }
  }
  return arr;
}

Array.prototype.sample = function(N){
  let tempThis = this.slice();
  let sampled = [];
  for (var i = 0; i < N; i++) {
    sampled.push(tempThis.splice([Math.floor(Math.random()*tempThis.length)],1)[0]);
  }
  return sampled;
}

Array.prototype.shuffle = function(){
  for (let i = this.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [this[i - 1], this[j]] = [this[j], this[i - 1]];
  }
  return this;
}
Array.prototype.clone = function(){
  return JSON.parse(JSON.stringify(this));
}