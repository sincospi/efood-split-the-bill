import toCurrencyStr from './toCurrencyStr';
import Big from 'big.js';

export function characterizeText(text) {
  const lines = text.split('\n').filter(Boolean);

  return lines.map(line => {
    const lineText = line.trim();
    const priceMatch = lineText.match(/^([xX]|Σύνολο:)?\s*([0-9.,-]+)\s?€$/);
    if (priceMatch) {
      return { type: 'price', value: parseFloat(priceMatch.pop().replace(',', '.')) };
    }

    const quantityMatch = lineText.match(/^(\d)[xX]?$/);
    if (quantityMatch) {
      return { type: 'quantity', value: parseInt(quantityMatch[0], 10) };
    }

    return { type: 'description', value: lineText };
  });
}

function calculateTotalFromBill(bill) {
  return bill.reduce((sum, item) => sum.add(Big(item.price).times(item.quantity)), Big(0));
}

export default function buildBill(textBill) {
  const data = characterizeText(textBill);

  console.debug('--- Characterization ---');
  data.forEach(item => console.debug(item));

  let bill = [];
  let orderItem = {};

  data.forEach(item => {
    if (item.type === 'description') {
      orderItem[item.type] = [orderItem[item.type], item.value]
        .filter(Boolean)
        .join(' - ');
    } else {
      // quantity or price items
      orderItem[item.type] = item.value;
    }

    if (item.type === 'price') {
      bill.push(orderItem);
      orderItem = {};
    }
  });

  console.debug('--- Parsed bill ---');
  bill.forEach(billItem => console.debug(billItem));

  // Filter out zero entries
  bill = bill.filter(item => item.price !== 0);

  // Extract Bill Total if available
  let orderPriceTotal;
  const lastBillItem = bill[bill.length - 1];
  if (!lastBillItem.quantity) {
    orderPriceTotal = lastBillItem.price;
    bill.pop(); // remove from bill
    console.log('Order Total:', toCurrencyStr(orderPriceTotal));
  }


  // Check if the bill has a peinata entry
  const pinataIndex = bill.findIndex(b => b.description.includes('Πειṽάτα'));
  let pinata;
  if (pinataIndex > -1) {
    pinata = Math.abs(bill[pinataIndex].price);
    bill.splice(pinataIndex, 1); // remove from the bill
    console.log('This order includes a pinata:', toCurrencyStr(pinata));
  }

  console.debug('--- Bill ---');
  bill.forEach(billItem => console.debug(billItem));

  let computedBillTotal = calculateTotalFromBill(bill);

  let discount;
  if (pinata) {
    discount = (computedBillTotal.minus(pinata)).div(computedBillTotal);
    console.log('Discount due to Pinata', discount.toFixed(3));
    computedBillTotal = computedBillTotal.minus(pinata);
  }

  console.debug('Computed Order Total:', toCurrencyStr(computedBillTotal));

  let parseChecksum;
  if (orderPriceTotal) {
    parseChecksum = toCurrencyStr(orderPriceTotal) === toCurrencyStr(computedBillTotal);
    if (parseChecksum) {
      console.log('Parse CHECKSUM OK');
    } else {
      console.error('Parse CHECKSUM FAILS')
    }
  }

  return {
    bill,
    discount,
    computedBillTotal,
    parseChecksum,
  };
}

/**
 * Analyzes a bill from each user's perspective.
 * For each user it collects all bill items that references their name.
 * For each entry it computes the user's share coefficent.
 * Finaly, creates a dictionary with an entry for each person containing their pay amount and analysis info
 */
export function buildUserPay(people, bill, discount, computedBillTotal) {
  const userPay = [];
  
  console.debug('--- Per user Bill Item ---');
  people.forEach(user => {
    const userBill = bill.filter(billItem => billItem.people.includes(user));
    const transactions = userBill.map(billItem => {
      const shareCoefficient = Big(1).div(billItem.people.length);
      let info = [];
      if (!shareCoefficient.eq(1)) {
        info.push(shareCoefficient.toFixed(2));
      }
      if (billItem.quantity !== 1) {
        info.push(billItem.quantity);
      }
      info.push(toCurrencyStr(billItem.price));
      info = info.join(' x ');
      const pay = shareCoefficient.times(billItem.quantity).times(billItem.price);
      if (info.match(/x/)) {
        console.debug(`${user}: ${info} = ${toCurrencyStr(pay)}`);
      } else {
        console.debug(`${user}: ${info}`);
      }
      return {
        info,
        pay,
      };
    });

    let userPayTotal = transactions.reduce((sum, transactionItem) => sum.add(transactionItem.pay), Big(0));
    let userPayInfo = transactions.map(t => (t.info.match(/x/) && transactions.length > 1) ? `(${t.info})` : t.info).join(' + ');
    if (discount) {
      userPayTotal = userPayTotal.times(discount);
      userPayInfo = `( ${userPayInfo} ) x ${discount.toFixed(3)}`;
    }

    if (transactions.length) {
      userPay.push({
        user,
        info: userPayInfo,
        pay: userPayTotal,
        payStr: toCurrencyStr(userPayTotal),
      });
    }
  });

  console.debug('--- User Pay ---');
  Object.values(userPay).forEach(userPayItem => console.debug(`${userPayItem.user}: ${userPayItem.info} = ${userPayItem.payStr}`));

  const payableTotal = Object.values(userPay).reduce((sum, userPayItem) => sum.add(userPayItem.pay), Big(0));
  console.debug('Payable Total:', toCurrencyStr(payableTotal));

  const payChecksum = toCurrencyStr(payableTotal) === toCurrencyStr(computedBillTotal);
  if (payChecksum) {
    console.log('Payable CHECKSUM OK');
  } else {
    console.error('Payable CHECKSUM FAILED');
  }
  return {
    userPay,
    payChecksum,
  };
}
