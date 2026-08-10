import handler from '../../api/projects.js';
import { adapt } from '../_adapter.js';

export const onRequestGet = adapt(handler);
