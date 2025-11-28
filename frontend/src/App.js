import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormViewer from './pages/FormViewer';
import ResponseViewer from './pages/ResponseViewer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form-builder" element={<FormBuilder />} />
        <Route path="/form/:formId" element={<FormViewer />} />
        <Route path="/forms/:formId/responses" element={<ResponseViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
