import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';

import './App.css';
import Login from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';

const router = createBrowserRouter([
  {path: '/', element: <ProtectedRoute><div>Home Page - Protected</div></ProtectedRoute>},
  {path: '/login', element: <Login />},
  {path: '/signup', element: <SignupPage />},
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;