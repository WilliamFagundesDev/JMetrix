import { contextBridge } from 'electron';

// Expose safe desktop environment info to window.jmetrixDesktop
contextBridge.exposeInMainWorld('jmetrixDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0'
});

