import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Slider from "@mui/joy/Slider";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { socket } from "../socket";
import Colors from "../Colors";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import Switch, { switchClasses } from '@mui/joy/Switch';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
function SwitchControl({ status, setStatus, color, led, callback }) {

  return (
    <Switch
      slotProps={{
        track: {
          children: (
            <React.Fragment>
              <Typography component="span" level="inherit" sx={{ ml: '10px' }}>
                On
              </Typography>
              <Typography component="span" level="inherit" sx={{ mr: '9px' }}>
                Off
              </Typography>
            </React.Fragment>
          ),
        },
      }}
      variant={status ? 'solid' : 'outlined'}
      checked={status}
      onChange={(event) => {
        setStatus(event.target.checked)
        if (led) {
          callback(led, event.target.checked)

        } else {
          callback(event.target.checked)
        }
      }}

      sx={(theme) => ({
        '& .MuiSwitch-track': {
          borderRadius: '15px',
          height: '30px',
        },
        '& .MuiSwitch-thumb': {
          width: '30px',
          height: '30px',
          borderRadius: '50%',
        },
        display: 'inherit',
        '--Switch-thumbSize': '30px', // Doubled from 30px
        '--Switch-trackWidth': '60px', // Doubled from 64px
        '--Switch-trackHeight': '30px', // Doubled from 31px
        '--Switch-radius': '100000px', // Set the desired radius value

        '--Switch-thumbShadow': 'inset 0 0 0 1px #dee2e6',

        '--Switch-trackBorderColor': '#dee2e6',
        '--Switch-trackBackground': '#e9ecef',
        '--Switch-thumbBackground': '#fff',
        '&:hover': {
          '--Switch-thumbBackground': '#fff',
          '--Switch-trackBackground': '#e9ecef',
        },
        [`&.${switchClasses.checked}`]: {
          '--Switch-thumbShadow': 'none',
          '--Switch-trackBackground': color,
          '&:hover': {
            '--Switch-trackBackground': color,
          },
        },
        [`&.${switchClasses.disabled}`]: {
          '--Switch-thumbColor': '#f8f9fa',
          '--Switch-trackBackground': '#e9ecef',
        },
        [theme.getColorSchemeSelector('dark')]: {
          '--Switch-trackBorderColor': 'rgb(55, 58, 64)',
          '--Switch-trackBackground': 'rgb(55, 58, 64)',
          '--Switch-thumbShadow': 'none',
        },
      })}
    />

  );
}


const CustomSlider = styled(Slider)(({ theme }) => {
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    color: '#C0C0C0',
    padding: 0,
    height: isMobileScreen ? 5 : 10, // Adjust height based on screen size
    '& .MuiSlider-track': {
      border: 'none',
      backgroundColor: '#C0C0C0',
    },
    '& .MuiSlider-thumb': {

      backgroundColor: '#fff',
      border: '2px solid #707070',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
        boxShadow: 'inherit',
      },
      '&::before': {
        display: 'none',
      },
    },
    '& .MuiSlider-valueLabel': {
      fontSize: {
        xs: "0.625rem", // Equivalent to 10px on most browsers
        sm: "0.75rem", // Equivalent to 12px on most browsers
        md: "0.875rem", // Equivalent to 14px on most browsers
        lg: "1rem", // Equivalent to 16px on most browsers
        xl: "1.125rem", // Equivalent to 18px on most browsers
      },
      background: 'unset',
      padding: 0,
      width: isMobileScreen ? 32 : 40, // Adjust value label width based on screen size
      height: isMobileScreen ? 32 : 40, // Adjust value label height based on screen size
      borderRadius: '50% 50% 50% 0',
      backgroundColor: '#C0C0C0',
      transformOrigin: 'bottom left',
      transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
      '&::before': { display: 'none' },
      '&.MuiSlider-valueLabelOpen': {
        transform: 'translate(50%, -100%) rotate(-20deg) scale(1)',
      },
      '& > *': {
        transform: 'rotate(45deg)',
      },
    },
  };
});


function Action({ onChangeSpeed }) {
  const theme = useTheme();
  const isLowResolution = useMediaQuery(`@media (max-resolution: 1dppx)`);
  const isHighResolution = useMediaQuery(`@media (min-resolution: 2dppx)`);
  const [redLedState, setRedLedState] = useState(false);
  const [greenLedState, setGreenLedState] = useState(false);
  const [detectObjectState, setDetectObjectState] = useState(false);

  const refreshLed = async () => {
    try {
      const response = await axios.get(window.location.origin + '/getState');
      setRedLedState(response.data.RedLed);
      setGreenLedState(response.data.GreenLed);
      setDetectObjectState(response.data.Detect)
    } catch (error) {
      console.error('Error fetching LED states:', error);
    }
  };

  useEffect(() => {
    // Fetch initial LED states when the component mounts
    refreshLed();

    // Set an interval to call refreshLed every 5 seconds
    const interval = setInterval(refreshLed, 5000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);


  function sendLed(led, status) {
    let data = { led: led, status: status };
    console.log("led", data)
    data = JSON.stringify(data);
    socket.emit("led", data);
  }


  const enableDetection = (status) => {
    let data = { detect: status };
    data = JSON.stringify(data);
    socket.emit("detect", data);
  };

  return (
    <Card
      orientation='vertical'
      variant='plain'
      sx={{
        alignItems: "left",
        bgcolor: Colors.primary,
        height: "100%"
      }}
    >
      <Stack
        direction='column'
        justifyContent='center'
        spacing={2}
      >
        <Stack justifyContent="stretch" sx={{
          width: "100%",
          justifyContent: "space-between", // Distribute horizontally
          "& .MuiFormControlLabel-root": { flex: 1 }, // Make FormControlLabel take equal space
        }}>
          <Typography
            id='track-inverted-slider'
            gutterBottom
            sx={{
              color: "#fff", fontWeight: "bold",
              fontSize: {
                xs: "0.875rem", // Equivalent to 14px on most browsers
                sm: "1rem", // Equivalent to 16px on most browsers
                md: "1.125rem", // Equivalent to 18px on most browsers
                lg: "1.25rem", // Equivalent to 20px on most browsers
                xl: "1.375rem", // Equivalent to 22px on most browsers
              },

              paddingBottom: "2vh"
            }}
          > Controls
          </Typography>
          <FormGroup aria-label="position" row>
            <FormControlLabel
              value="red"
              control={
                <SwitchControl
                  color="red"
                  status={redLedState}
                  setStatus={setRedLedState}
                  callback={sendLed}
                  led="RedLed"
                  sx={{
                    width: isLowResolution ? '100%' : isHighResolution ? '50%' : 'auto', // Adjust width based on screen resolution
                  }}
                />
              }
              label="Red Led"
              labelPlacement="bottom"
              sx={{
                width: isLowResolution ? '100%' : isHighResolution ? '50%' : 'auto', // Adjust width based on screen resolution
                '& .MuiFormControlLabel-label': {
                  fontSize: isLowResolution
                    ? {
                      xs: '0.5rem', // 8px
                      sm: '0.625rem', // 10px
                      md: '0.75rem', // 12px
                      lg: '0.875rem', // 14px
                      xl: '1rem', // 16px
                    }
                    : {
                      xs: '0.625rem', // 10px
                      sm: '0.75rem', // 12px
                      md: '0.875rem', // 14px
                      lg: '1rem', // 16px
                      xl: '1.125rem', // 18px
                    }
                },
              }}
            />
            <FormControlLabel
              value="green"
              control={<SwitchControl
                color="green"
                status={greenLedState}
                setStatus={setGreenLedState}
                callback={sendLed}
                led="GreenLed"

              />}
              label="Green Led"
              labelPlacement="bottom"
              sx={{
                width: isLowResolution ? '100%' : isHighResolution ? '50%' : 'auto', // Adjust width based on screen resolution
                '& .MuiFormControlLabel-label': {
                  fontSize: isLowResolution
                    ? {
                      xs: '0.5rem', // 8px
                      sm: '0.625rem', // 10px
                      md: '0.75rem', // 12px
                      lg: '0.875rem', // 14px
                      xl: '1rem', // 16px
                    }
                    : {
                      xs: '0.625rem', // 10px
                      sm: '0.75rem', // 12px
                      md: '0.875rem', // 14px
                      lg: '1rem', // 16px
                      xl: '1.125rem', // 18px
                    }
                },
              }}
            />
            <FormControlLabel

              value="detect"
              control={<SwitchControl
                color="orange"
                status={detectObjectState}
                setStatus={setDetectObjectState}
                callback={enableDetection}

              />}
              label="Detect Object"
              labelPlacement="bottom"

              sx={{
                width: isLowResolution ? '100%' : isHighResolution ? '50%' : 'auto', // Adjust width based on screen resolution
                '& .MuiFormControlLabel-label': {
                  fontSize: isLowResolution
                    ? {
                      xs: '0.5rem', // 8px
                      sm: '0.625rem', // 10px
                      md: '0.75rem', // 12px
                      lg: '0.875rem', // 14px
                      xl: '1rem', // 16px
                    }
                    : {
                      xs: '0.625rem', // 10px
                      sm: '0.75rem', // 12px
                      md: '0.875rem', // 14px
                      lg: '1rem', // 16px
                      xl: '1.125rem', // 18px
                    }
                },
              }}
            />
          </FormGroup>
        </Stack>
        <Typography
          id='track-inverted-slider'
          gutterBottom
          sx={{
            color: "#fff", fontWeight: "bold", fontSize: {
              xs: "0.875rem", // Equivalent to 14px on most browsers
              sm: "1rem", // Equivalent to 16px on most browsers
              md: "1.125rem", // Equivalent to 18px on most browsers
              lg: "1.25rem", // Equivalent to 20px on most browsers
              xl: "1.375rem", // Equivalent to 22px on most browsers
            },
          }}

        > Speed
        </Typography>
        <CustomSlider

          valueLabelDisplay="auto"
          aria-label="pretto slider"
          onChange={(event) => onChangeSpeed(event)}
        />
      </Stack>
    </Card>
  );
}

export default Action;
