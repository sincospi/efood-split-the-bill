import Big from 'big.js';

export default function toCurrencyStr(number) {
  return `${Big(number).toFixed(2)}€`;
}
