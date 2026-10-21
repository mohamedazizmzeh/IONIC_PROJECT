import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App';
import './global.scss';
import './theme/variables.scss';

setupIonicReact();
defineCustomElements(window);
createRoot(document.getElementById('root')!).render(<App />);
