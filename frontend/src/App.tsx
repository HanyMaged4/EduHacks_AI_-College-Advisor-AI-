import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';

import './App.css';
import Login from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import ChatBot from './Pages/ChatPage';

const router = createBrowserRouter([
  {path: '/', element: <ProtectedRoute><ChatBot /></ProtectedRoute>},
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