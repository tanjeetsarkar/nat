// src/App.jsx
import { ApolloProvider } from '@apollo/client/react';
import { client } from './graphql/client';
// import WorkspaceList from './components/WorkspaceList';
import TrelloBoard from './components/TrelloBoard';

function App() {
  return (
    <ApolloProvider client={client}>
      <div style={styles.container}>
        <TrelloBoard />
      </div>
    </ApolloProvider>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }
};

export default App;