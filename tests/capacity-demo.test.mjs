import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureScheduledDemo,scheduledDemoVatCount} from '../src/capacity-demo.ts';

const orders=[
 {card:'Y001',vats:8,pieces:24},
 {card:'Y002',vats:7,pieces:21},
 {card:'Y003',vats:10,pieces:30}
];

test('已排演示数据补足到 20 缸并保留已有记录',()=>{
 const existing={card:'Y001',vat:'J16#',slot:8,pieces:3};
 const result=ensureScheduledDemo(orders,[existing]);
 assert.equal(result.length,scheduledDemoVatCount);
 assert.equal(result[0],existing);
 assert.equal(new Set(result.map(item=>`${item.vat}-${item.slot}`)).size,result.length);
});

test('已排演示数据不会超过订单可用缸数',()=>{
 const result=ensureScheduledDemo(orders,[]);
 for(const order of orders)assert.ok(result.filter(item=>item.card===order.card).length<=order.vats);
});
