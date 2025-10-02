import React from 'react';
import { ApiProvider } from './contexts/ApiContext';
import ApiViewer from './components/ApiViewer';

import { CepProvider } from './contexts/CepContext';
import CepSearch from './components/CepSearch';

function App() {
  return (
    <>
      <ApiProvider>
        <ApiViewer />
      </ApiProvider>

      <hr />

      <CepProvider>
        <CepSearch />
      </CepProvider>
    </>
  );
}

export default App;
