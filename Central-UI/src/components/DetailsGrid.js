
import {
    Box,
    Stack,
    Grid,
    Typography,
    Card,
    CardContent,
    IconButton,

} from '@mui/joy';
import styles from './styles';
import SpeedIcon from '@mui/icons-material/Speed';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import KvsDisplay from './KvsDisplay';
import LightModeIcon from '@mui/icons-material/LightMode';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { apiConfigs } from '../assets/data/apiConfigs'

const grafanaUrl = apiConfigs.grafana



const customStyle = {
    backgroundPurple: {
        background: "rgb(40, 53, 147)",
        background: "linear-gradient(45deg, rgba(40, 53, 147, 1) 0%, rgba(121, 134, 203, 1) 100%)",
        color: "white"
    },
    backgroundGlass: {
        background: "rgba(130,130,130, 0.5)",
    },
    redOn: {
        background: "rgb(219, 121, 103)",
        background: "linear-gradient(100deg, rgba(219, 121, 103, 1) 0%, rgba(230, 8, 8, 1) 100%)",
        color: "white"
    },
    redOff: {
        background: "rgba(237, 237, 237, 1)",
        color: "rgb(50, 56, 62)"
    },
    redOnIcon: {
        color: "white"
    },
    grafanaBackground: {
        background: "rgb(244, 176, 2)",
        background: "linear-gradient(100deg, rgba(244, 176, 2, 1) 0%, rgba(244, 144, 2, 1) 100%)",
        fontSize: "22px",
        fontWeight: "bold",
        maxWidth: "300px"
    }
}
function SendLedStatus(car, id, status, action) {

    action(car, { led: { id, status: !status } })


}
function LedButton({ id, car, led, color, setLed }) {
    return (
        <IconButton
            onClick={() => SendLedStatus(car, id, led, setLed)}
            sx={{
                borderRadius: "100px",
                backgroundColor: "#555",
                fontSize: "70px",
                padding: "1px",
                "&:hover": {
                    borderRadius: "100px",
                    color: led ? "#ccc" : color,
                    backgroundColor: "#555"

                }
            }}>
            <LightModeIcon sx={{
                color: led ? color : "#ccc",
                backgroundColor: "#fff",
                borderRadius: "100px",
                fontSize: "90px",
                padding: "10px",
                "&:hover": {
                    color: led ? "#ccc" : color,
                    transform: "scale(1.05)",
                    transition: "transform 800ms ease",
                    boxShadow: " 0 0 10px #333"

                }
            }} />
        </IconButton>

    );
}


const DetailsGrid = ({ carDetails, setCarStatusFunction }) => {
    let speed = -1
    let battery = -1
    let GreenLed = false
    let RedLed = false

    carDetails.metrics.forEach(metric => {

        if (metric['name'] === "Speed") {
            speed = metric['value']
        }
        if (metric['name'] === "Battery") {
            battery = metric['value']
        }
        if (metric['name'] === "GreenLed") {
            GreenLed = metric['value'] || metric['value'] != 0 ? true : false
        }
        if (metric['name'] === "RedLed") {
            RedLed = metric['value'] || metric['value'] != 0 ? true : false

        }
    })

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
            >
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <div>
                        <Typography level="title-md" style={styles.title}>{carDetails.name.toUpperCase()}</Typography>
                    </div>
                </Grid>
            </Grid>
            <Grid container
                layout={'row'}
                spacing={2}
                gridTemplateColumns="repeat(1, 1fr)"
                justifyContent="space-between"            >

                <Grid item xs={3} sm={3} md={3} lg={3} xl={3}>
                    <Stack
                        direction="column"
                        justifyContent="center"
                        spacing={2}>
                        <Card style={customStyle.backgroundPurple} >
                            <CardContent>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <SpeedIcon sx={{ color: "white" }}></SpeedIcon>
                                    <Typography sx={{ color: "white" }} level="body-md" >Velocity</Typography>
                                </Stack>
                                <Typography sx={{ color: "white", fontSize: "50px", fontWeight: "bold" }} align="right">{speed + " cm/s"}</Typography>
                            </CardContent>
                        </Card>
                        <Card style={customStyle.backgroundPurple}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <BatteryFullIcon sx={{ color: "white" }} ></BatteryFullIcon>
                                    <Typography sx={{ color: "white" }} level="body-md" >Battery</Typography>
                                </Stack>
                                <Typography sx={{ color: "white", fontSize: "50px", fontWeight: "bold" }} align="right"  >{battery + " V"}</Typography>
                            </CardContent>
                        </Card>
                        <Card style={customStyle.backgroundPurple} >
                            <Stack direction="row" alignItems="center" gap={1}>
                                <LightbulbIcon sx={{ color: "white" }}  ></LightbulbIcon>
                                <Typography sx={{ color: "white" }} level="body-md" >Leds</Typography>
                            </Stack>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>

                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <LedButton id="GreenLed" led={GreenLed} color="green" car={carDetails.name} setLed={setCarStatusFunction}></LedButton>
                                    </Stack>


                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <LedButton id="RedLed" led={RedLed} color="red" car={carDetails.name} setLed={setCarStatusFunction}></LedButton>
                                    </Stack>

                                </Stack>
                            </CardContent>
                        </Card>

                    </Stack>

                </Grid>
                <Grid item xs={6} sm={6} md={6} lg={6} xl={6} >
                    <Stack style={{ ...styles.glass, ...customStyle.backgroundGlass }} item xs={12} sm={12} md={12} lg={12} xl={12} >
                        <KvsDisplay car={carDetails.name}></KvsDisplay>
                    </Stack>
                    <Stack alignItems="center" justifyContent="center" sx={{ marginTop: "10px" }}>
                        <Card style={customStyle.grafanaBackground}  >
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-around" gap={1}>
                                    <Typography sx={{ color: "rgb(255, 255, 255)", fontSize: "40px" }} level="body-md" onClick={() => window.open(grafanaUrl + carDetails.name, '_blank')}>See Metrics</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box >)
}

export default DetailsGrid;