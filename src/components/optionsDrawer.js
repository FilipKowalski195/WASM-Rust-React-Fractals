import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import InboxIcon from '@material-ui/icons/MoveToInbox'
import React from 'react'

export default function optionsDrawer(props) {
    
    
    const list = () => (
        <List style={{width: "400px"}}>
            {['Option1', "Option2", 'Option3', 'Option4'].map(text => (
                <ListItem button key={text}>
                <ListItemIcon> <InboxIcon /> </ListItemIcon>
                <ListItemText primary={text} style={{fontSize: "34px"}}/>
            </ListItem>
            ))
            }
        </List>
        
    )
    
    return (
        <div>
            <Drawer 
                anchor={'right'}
                open={props.open}
                onClose={props.toggleDrawer}
                className="drawer"
                >
                    {list()}
                </Drawer>
        </div>
    )
}
