import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import {ThemeProvider} from 'styled-components';

import App from './app';
import {GlobalStyles} from './globalStyles';
import {lightTheme} from './theme';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  </StrictMode>
);
