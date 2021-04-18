import { useState} from 'react'
import { Tab, Tabs, AppBar, IconButton, Button, Drawer } from '@material-ui/core'
import SettingsIcon from '@material-ui/icons/Settings';
import './App.css';

import TabPanel from './components/tabPanel'
import JuliaSet from './components/juliaSet'
import MandelbrotSet from './components/mandelbrotSet'
import OptionsDrawer from './components/optionsDrawer.js'

const App = () => {

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };


  const [value, setValue] = useState(0)
  const [openDrawer, setOpenDrawer] = useState(false)
  
  const toggleDrawer = () => { 
    setOpenDrawer(prevState => !prevState)
  }
  return (
    <div>
      <AppBar> 
        <Tabs 
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
          centered>
        <Tab label="Fraktale Julii"  {...a11yProps(0)}/>
        <Tab label="Zbiór Mandelbrota" {...a11yProps(1)}/>
        <Button style={{color: 'white', marginRight: 0}} onClick={toggleDrawer}> <SettingsIcon /> </Button>
        </Tabs>
      </AppBar>
      

      <TabPanel value={value} index={0} className="panel">
        <JuliaSet />
      </TabPanel>
      <TabPanel value={value} index={1} className="panel">
        <MandelbrotSet />
      </TabPanel>
      <OptionsDrawer open={openDrawer} toggleDrawer={toggleDrawer} />
    </div>
    
  );

  
}



export default App;
