export const initialBrief = {
  title: 'Launch packaging',
  quantity: 1000,
  budgetCents: 280000,
  deliveryBy: '2026-11-28',
  minimumRecycled: 70,
  priority: 'lowest_total'
};

export const sampleQuotes = [
  {id:'alder',name:'Alder Print',short:'AP',accent:'clay',reference:'ALD-104',text:[
    'ALDER PRINT / QUOTE ALD-104',
    'Item: Custom printed mailer boxes',
    'Quantity: 1000',
    'Unit price: USD 2.40',
    'Setup: USD 120.00',
    'Shipping: USD 95.00',
    'Tax: included',
    'Delivery: 2026-11-24',
    'Recycled content: 80%',
    'Prices apply only to the quantity above.'
  ].join('\n')},
  {id:'northline',name:'Northline Packaging',short:'NP',accent:'blue',reference:'NTH-208',text:[
    'NORTHLINE PACKAGING / QUOTE NTH-208',
    'Item: Custom printed mailer boxes',
    'Quantity: 1000',
    'Unit price: USD 2.05',
    'Setup: USD 180.00',
    'Shipping: charged separately; amount to be confirmed',
    'Tax: included',
    'Delivery: 2026-11-27',
    'Recycled content: 70%',
    'Please request the freight charge before ordering.'
  ].join('\n')},
  {id:'paperfield',name:'Paperfield Co.',short:'PC',accent:'sage',reference:'PAP-312',text:[
    'PAPERFIELD CO. / QUOTE PAP-312',
    'Item: Custom printed mailer boxes',
    'Quantity: 1000',
    'Unit price: USD 2.65',
    'Setup: USD 0.00',
    'Shipping: USD 0.00',
    'Tax: included',
    'Delivery: 2026-11-22',
    'Recycled content: 100%',
    'Setup and standard freight are included in this price.'
  ].join('\n')}
];
