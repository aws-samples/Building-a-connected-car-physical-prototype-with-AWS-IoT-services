import { useState }  from 'react';
import Chip from '@mui/joy/Chip';
import List from '@mui/joy/List';
import ListSubheader from '@mui/joy/ListSubheader';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import styles from './styles';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export default function Navigation({ cars = [], selectedCar, setCar }) {
    
  
    return (
        <List
            size="sm"
            sx={{ '--ListItem-radius': 'var(--joy-radius-sm)', '--List-gap': '4px' }}
        >
            <ListItem nested>
                <ListSubheader sx={{ letterSpacing: '2px', fontWeight: '800' }}>
                    Browse
                </ListSubheader>
                <List
                    aria-labelledby="nav-list-browse"
                    sx={{
                        '& .JoyListItemButton-root': { p: '8px' },
                    }}
                >
                    { cars.map((car, index) => {
                        const isAnomaly = car.Anomalies ? car.Anomalies.length : 0
                        return (<ListItem key={index}>
                            
                            <ListItemButton onClick={(event)=>{setCar(index)}} selected={index == selectedCar}>
                            <ListItemDecorator>
                                    <DirectionsCarFilledRoundedIcon style={{ ...styles.iconCustomNav }} fontSize="small" />
                            </ListItemDecorator>
                                <ListItemContent style={{ ...styles.primaryColor }} >{car.Name.toUpperCase()}</ListItemContent>
                                {isAnomaly ? <ReportProblemIcon sx={{color:"red"}}></ReportProblemIcon> : null }
                        </ListItemButton>
                    </ListItem>
                    )})} 
                </List>
            </ListItem>
        </List>
    );
}
