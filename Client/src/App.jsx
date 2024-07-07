import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import Navbar from "./Components/Navbar"
import Home from '../src/Components/Home';
import Login from '../src/Components/Login';
import Foote from '../src/Components/Foote';
import Sign from '../src/Components/Sign';
import Card from './Components/Card'
import UODGaming from './Components/UODGaming'
import Download from './Components/Download'
import Snake from './Components/Snake'
import ColorG from './Components/ColorG'
import TTT from './Components/TTT'


const App = () => {
  return (
    <div>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign" element={<Sign />} />
        <Route path="/Card" element={<Card/>}/>
        <Route path="/Foote" element={<Foote />} />
        <Route path="/UODGaming" element={<UODGaming />} />
        <Route path="/Download" element={<Download />} />
        <Route path="/Snake" element={<Snake />} />  
        <Route path="/ColorG" element={<ColorG />} />  
        <Route path="/TTT" element={<TTT />} />  
      </Routes>            

      
    </div>
  )
}

export default App

