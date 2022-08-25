import {createGlobalStyle} from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${p => p.theme.backgroundSecondary};
    color: ${p => p.theme.textColor};
    padding: ${p => p.theme.space[4]};
    font-size: 14px;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${p => p.theme.headingColor};
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 0.4em;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.4em;
  }

  small {
    color: ${p => p.theme.subText};
    font-size: ${p => p.theme.fontSizeSmall};
  }

  input {
    font-size: 1rem;
    transition: color, box-shadow ${p => p.theme.animation.vFastOut};
  }
  input:focus {
    outline: none;
    ${p => p.theme.utils.focusVisible}; 
  }
`;
