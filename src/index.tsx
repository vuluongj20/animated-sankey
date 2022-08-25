import ReactDOM from 'react-dom/client';
import {ThemeProvider} from 'styled-components';

import App from './app';
import {GlobalStyles} from './globalStyles';
import {lightTheme} from './theme';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <ThemeProvider theme={lightTheme}>
    <GlobalStyles />
    <App />
  </ThemeProvider>
);
