
import {
    Divider,
    Box,
    Typography,
    ListItem,
    List,
    Grid,
    Tooltip

} from '@mui/joy';
import GrafanaButton from './GrafanaButton';
import DetailsButton from './DetailsButton';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import styles from './styles';
import { apiConfigs } from '../assets/data/apiConfigs'

const grafanaUrl = apiConfigs.grafana

const CarsGrid = ({ cars, setCar }) => {
    return (
        <Box
            component="li"
            variant="outlined"
            sx={{
                overflow: "hidden",
                p: 2,
                listStyle: 'none',
                width: "100%",
                PaddingTop: "2%",
                PaddingLeft: "1%",
                paddingRight: "1%",
            }}
        >
            <Grid container
                layout={'row'}
                spacing={2}
                gridTemplateColumns="repeat(1, 1fr)"
                p={1}
                justifyContent="center"
                alignItems="center"

            >
                <Grid item xs={8} sm={8} md={8} lg={8} xl={8}>


                    <div>
                        <Typography level="title-md" style={styles.title}>Vehicles</Typography>
                    </div>




                    <List sx={{
                        "--List-padding": "1px"
                    }}>
                        {cars.map((car, index) => {
                            const anomalies = car.Anomalies
                            return (
                                <ListItem style={index % 2 == 0 ? styles.listItemCustomColor0 : styles.listItemCustomColor1} key={"car" + index} className="item-hover" >
                                    <Box display="flex" alignItems="center" style={styles.itemLeft} >
                                        {/* <IconButton onClick={(event) => { setCar(index) }} className="glass-panel" style={styles.icon}> */}
                                        <DirectionsCarFilledRoundedIcon style={{ ...styles.iconCustom }} />
                                        {/* </IconButton> */}
                                        <Typography style={styles.listTypographyCustom} > {car.Name.toUpperCase()} </Typography>
                                        {anomalies && anomalies.indexOf("Battery") > -1 ?
                                            (<Tooltip title="Low Battery">
                                                <BatteryAlertIcon sx={{ fontSize: "25px", color: "orange" }}>
                                                </BatteryAlertIcon>
                                            </Tooltip>)
                                            : null}

                                    </ Box>
                                    <DetailsButton action={setCar} car={index} style={styles.button}></DetailsButton>
                                    <GrafanaButton style={styles.button} url={grafanaUrl + car.Name}></GrafanaButton>
                                </ListItem>
                            )
                        }
                        )}
                    </List>
                </Grid>
            </Grid>
        </Box>)
}

export default CarsGrid;