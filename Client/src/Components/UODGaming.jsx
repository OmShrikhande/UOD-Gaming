import React from 'react';
import Navbar from './Navbar';
import Card from './Card';
import Foote from './Foote';
import Info from './Info';
import './UODGaming.css'
const UODGaming = () => {
  return (
    
  <body>
    {/* <Navbar /> */}
   
   <div className="background-image">
      
      <div className="contentimg">
        <h1 style={{ fontFamily: 'Blanka', fontSize: 'xx-large' }}>G a m e - O n</h1>
      </div>
    </div>

    <Card />
    <Info />

    <Foote/>
  </body>
  );
};

export default UODGaming;