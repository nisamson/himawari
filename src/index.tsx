import React from 'react';
import ReactDOM from 'react-dom';
import App from './client/components/App';
import {AuthProvider} from "./client/components/AuthContext";

ReactDOM.render(
  <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
