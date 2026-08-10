import handler from '../../api/heatmap.js';
import { adapt } from '../_adapter.js';

export const onRequestGet = adapt(handler);
