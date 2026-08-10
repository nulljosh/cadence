import handler from '../../api/stats.js';
import { adapt } from '../_adapter.js';

export const onRequestGet = adapt(handler);
