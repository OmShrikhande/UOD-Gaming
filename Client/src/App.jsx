import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import Navbar from "./Components/Navbar"
import Home from '../src/Components/Home';
import Login from '../src/Components/Login';
import Sign from '../src/Components/Sign';
import Card from './Components/Card'

const App = () => {
  return (
    <div>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign" element={<Sign />} />
        <Route path="/Card" element={<Card/>}/>
      </Routes>
    </div>
  )
}

export default App

