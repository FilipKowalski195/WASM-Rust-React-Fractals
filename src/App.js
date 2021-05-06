import { useState } from 'react'
import { Tab, Tabs, AppBar, IconButton, Button, Drawer } from '@material-ui/core'

import './App.css';

import Fractal from './components/fractal'


const App = () => {

  return (
    <div>
        <Fractal />
    </div>
  );
}



export default App;
