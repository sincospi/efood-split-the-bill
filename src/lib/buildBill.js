import toCurrencyStr from './toCurrencyStr';
import Big from 'big.js';

function characterizeText(text) {
  const lines = text.split('\n').filter(Boolean);

  return lines.map(line => {
    const lineText = line.trim();
    const priceMatch = lineText.match(/([0-9.-]+)\s+€/);
    if (priceMatch) {
      return { type: 'price', value: parseFloat(priceMatch[1]) };
    }

    const quantityMatch = lineText.match(/^(\d)$/);
    if (quantityMatch) {
      return { type: 'quantity', value: parseInt(quantityMatch[0], 10) };
    }

    return { type: 'description', value: lineText };
  });
}

export default function buildBill(textBill) {
  const data = characterizeText(textBill);
  data.forEach(item => console.debug(item));

  let totalAfterDiscountEuro = data.pop();
  if (totalAfterDiscountEuro.type === 'price') {
    totalAfterDiscountEuro = totalAfterDiscountEuro.value;
    console.log('Price after discount', toCurrencyStr(totalAfterDiscountEuro));
  } else {
    return { bill: [] };
  }

  let bill = [];
  let newOrderItem = {};

  data.forEach(item => {
    if (item.type === 'description') {
      newOrderItem[item.type] = [newOrderItem[item.type], item.value]
        .filter(Boolean)
        .join(' - ');
    } else {
      newOrderItem[item.type] = item.value;
    }

    if (item.type === 'price') {
      bill.push(newOrderItem);
      newOrderItem = {};
    }
  });

  // Filter out zero or negative entries
  bill = bill.filter(item => item.price > 0);

  const totalBeforeDiscountEuro = bill.reduce((sum, item) => {
    const itemCost = Big(item.price).times(item.quantity);
    return sum.add(itemCost);
  }, Big(0));

  console.log('Price before discount', toCurrencyStr(totalBeforeDiscountEuro));

  const discount = Big(totalAfterDiscountEuro).div(totalBeforeDiscountEuro);
  console.log(
    'Discount',
    toCurrencyStr(totalBeforeDiscountEuro.minus(totalAfterDiscountEuro)),
    `(${Big(discount).toFixed(5)})`,
  );

  return {
    bill,
    totalAfterDiscountEuro,
    totalBeforeDiscountEuro,
    discount,
  };
}

export function buildUserBill(people, bill, discount) {
  let checkSum = Big(0);
  const perUserBill = {};
  people.forEach(user => {
    let userPay = Big(0.0);
    const userBill = bill.filter(billItem => billItem.people.includes(user));
    if (userBill.length) {
      perUserBill[user] = { items: [] };
      console.log(`=========== ${user} ==========`);

      userBill.forEach(billItem => {
        const shareCoefficient = Big(1).div(billItem.people.length);
        console.log(
          `${Big(shareCoefficient).toFixed(2)} x ${
            billItem.quantity
          } x ${toCurrencyStr(billItem.price)} - ${billItem.description.slice(
            0,
            70,
          )}`,
        );
        perUserBill[user].items.push(
          `(${Big(shareCoefficient).toFixed(2)} x ${
            billItem.quantity
          } x ${toCurrencyStr(billItem.price)})`,
        );
        userPay = userPay.plus(
          Big(shareCoefficient)
            .times(billItem.quantity)
            .times(billItem.price),
        );
      });
      console.log(`Pay before discount: ${toCurrencyStr(userPay)}`);
      perUserBill[user].payBeforeDiscount = toCurrencyStr(userPay);
      const payAfterDiscount = Big(userPay).times(discount);
      console.log(`Pay after discount: ${toCurrencyStr(payAfterDiscount)}`);
      perUserBill[user].payAfterDiscount = toCurrencyStr(payAfterDiscount);
      checkSum = Big(checkSum).add(payAfterDiscount);
    }
  });
  console.log('perUserBill', perUserBill);
  return perUserBill;
}
