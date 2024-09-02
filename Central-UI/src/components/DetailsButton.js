import * as React from 'react';
import Button from '@mui/joy/Button';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
const styles={
    icon:{
        width: "35px",
        height: "35px",
        marginLeft:"4px",
        fill:"white"
    },
    button:{
        background: "#9FA8DA",
       //background: "linear-gradient(100deg, rgba(95, 184, 70, 1) 0%, rgba(31, 135, 15, 1) 100%)",
        width: "150px",
        fontSize: "22px",
        fontWeight:"bold"
    }


}

const DetailsButton = ({ action, car }) => {
    return (
        <Button onClick={() => action(car)} style={styles.button}>Details
            <TroubleshootIcon style={styles.icon}></TroubleshootIcon>
        </Button>)
}

export default DetailsButton;
