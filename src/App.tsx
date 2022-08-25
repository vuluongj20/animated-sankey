import styled from 'styled-components';

import Canvas from './canvas';

function App() {
  return (
    <Wrap>
      <Canvas />
    </Wrap>
  );
}

export default App;

const Wrap = styled('div')`
  max-width: 48rem;
  background: ${p => p.theme.background};
  border: solid 1px ${p => p.theme.innerBorder};
  border-radius: ${p => p.theme.borderRadiusLarge};
  padding: ${p => p.theme.space[3]};
  margin: 0 auto;
`;
