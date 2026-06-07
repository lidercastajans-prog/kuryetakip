// Customer balance (borç) is DERIVED live from data:
//   balance = (total of the customer's orders) − (total Tahsilat collected from them)
//
// Previously the balance was kept as a mutable counter on `customers.balance`,
// updated incrementally by addOrder/addPayment/etc. via a read-modify-write on
// possibly-stale local state. That counter could drift from the real movements
// (e.g. stored 1.500 ₺ while orders − payments = 0). Deriving it makes the
// balance always consistent with the statement and immune to that drift.
export function customerBalance(customerId, orders, cashTransactions) {
  const ordered = (orders || []).reduce(
    (sum, o) => (o.customerId === customerId ? sum + Number(o.amount || 0) : sum),
    0
  );
  const collected = (cashTransactions || []).reduce(
    (sum, t) =>
      (t.relatedCustomerId === customerId && t.category === 'Tahsilat')
        ? sum + Number(t.amount || 0)
        : sum,
    0
  );
  return ordered - collected;
}
