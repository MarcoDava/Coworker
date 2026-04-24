import { Buffer } from 'buffer';
import process from 'process';
// simple-peer expects Node globals in the browser
(globalThis as unknown as { Buffer: typeof Buffer; process: typeof process }).Buffer = Buffer;
(globalThis as unknown as { Buffer: typeof Buffer; process: typeof process }).process = process;

import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
