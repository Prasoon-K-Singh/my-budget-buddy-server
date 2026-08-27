import Counter from "../models/counter.model.js";

export async function getNextTransactionNo(session) {
  const counter = await Counter.findOneAndUpdate(
    {
      name: "transaction",
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      session,
    },
  );

  return counter.sequence;
}

export function adjustAmount(balance, transType, transAmount) {
  const newBal = 0;
  if (transType === "debit") {
    return balance - transAmount;
  }
  if (transType === "credit") {
    return balance + transAmount;
  }
  return newBal;
}

export const calculateTotal = (list = [], field, filter = () => true) => {
  return list.reduce((total, item) => {
    return filter(item) ? total + (Number(item[field]) || 0) : total;
  }, 0);
};

export function adjustExistingTransAmount(balance, transType, transAmount) {
  const newBal = 0;
  if (transType === "credit") {
    return balance - transAmount;
  }
  if (transType === "debit") {
    return balance + transAmount;
  }
  return newBal;
}
