import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import Home from '../src/Components/Home';
import Login from '../src/Components/Login';
import Sign from '../src/Components/Sign';

const App = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign" element={<Sign />} />
      </Routes>
    </div>
  );
};

export default App;
