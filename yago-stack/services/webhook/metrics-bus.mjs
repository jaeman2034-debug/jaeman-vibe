import client from 'prom-client';
import { EventEmitter } from 'node:events';

export const bus = new EventEmitter();
export const register = client.register;
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'yago_', register });

// Counters
export const c_rsvp = new client.Counter({ 
  name: 'yago_rsvp_total', 
  help: 'RSVP issued', 
  labelNames: ['meetup', 'bucket'] 
});

export const c_checkout = new client.Counter({ 
  name: 'yago_checkout_total', 
  help: 'Checkout started', 
  labelNames: ['meetup', 'bucket', 'provider'] 
});

export const c_paid = new client.Counter({ 
  name: 'yago_paid_total', 
  help: 'Payment paid', 
  labelNames: ['meetup', 'bucket', 'provider'] 
});

export const c_checkin = new client.Counter({ 
  name: 'yago_checkin_total', 
  help: 'Check-in completed', 
  labelNames: ['meetup', 'bucket'] 
});

// UTM 어트리뷰션 메트릭
export const c_visit = new client.Counter({ 
  name: 'yago_visit_total', 
  help: 'Attribution visit via redirect', 
  labelNames: ['meetup', 'source', 'medium', 'campaign'] 
});

export const c_rsvp_src = new client.Counter({ 
  name: 'yago_rsvp_by_src_total', 
  help: 'RSVP by utm source', 
  labelNames: ['meetup', 'source'] 
});

export const c_checkout_src = new client.Counter({ 
  name: 'yago_checkout_by_src_total', 
  help: 'Checkout by utm source', 
  labelNames: ['meetup', 'source'] 
});

export const c_paid_src = new client.Counter({ 
  name: 'yago_paid_by_src_total', 
  help: 'Paid by utm source', 
  labelNames: ['meetup', 'source'] 
});

// Gauges
export const g_capacity = new client.Gauge({ 
  name: 'yago_capacity', 
  help: 'Capacity by bucket', 
  labelNames: ['meetup', 'bucket', 'type'] 
});

export function emit(evt, payload) {
  bus.emit('evt', { type: evt, ts: Date.now(), ...payload });
}
