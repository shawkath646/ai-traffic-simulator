import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Filter upstream Three.js deprecation warnings emitted by third-party packages (e.g., R3F internal Clock usage)
if (typeof THREE.setConsoleFunction === 'function') {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (
      typeof message === 'string' &&
      (message.includes('Clock: This module has been deprecated') ||
        message.includes('PCFSoftShadowMap has been removed'))
    ) {
      return;
    }
    if (type === 'error') {
      console.error(message, ...params);
    } else if (type === 'warn') {
      console.warn(message, ...params);
    } else {
      console.log(message, ...params);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <App />
)

