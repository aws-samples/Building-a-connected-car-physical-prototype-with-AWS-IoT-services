// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react'

import {
    Grid,
    Box,
    Button,
    IconButton,
    InputLabel,
    InputAdornment,
    FormControl,
    Popover,
    Select,
    MenuItem,
    OutlinedInput,
    TextField,
    Typography
} from '@mui/material';

// import { makeStyles } from '@material-ui/core'

// AdapterDateFns moved from @mui/lab
//import AdapterDateFns from '@mui/lab/AdapterDateFns';
//import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

// DateTimePicker moved from @mui/lab
//import DateTimePicker from '@mui/lab/DateTimePicker';
//import DateTimePicker from '@mui/x-date-pickers/DateTimePicker';
//import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

// LocalizationProvider moved from @mui/lab
//import LocalizationProvider from '@mui/lab/LocalizationProvider';
//import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// const useStyles = makeStyles((theme) => {
//     return {
//         rightAlign: {
//             display: "flex",
//             justifyContent: "flex-end",
//             alignItems: "flex-end"
//         }
//     }
// })
const styles = {
    rightAlign: {
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end"
        }}

export default function KvsPlayerStreamSelector(props) {


    const {
        streamModeState,
        handleStreamModeChange,
        timestampModeState,
        handleTimestampModeChange,
        dateTimeValueState,
        handleDateTimeValueChange
    } = props;

    const [uncommittedDateTimeValue, setUncomittedDateTimeValue] = useState(new Date());

    // Date Time Popover display parameters and controls
    const [anchorEl, setAnchorEl] = useState(null);
    const dateTimePopOpen = Boolean(anchorEl);
    const id = dateTimePopOpen ? 'date-time-popover' : undefined;

    // Event handlers
    const handleDateTimePopOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleDateTimePopClose = () => {
        setAnchorEl(null);
    }

    const handleCommitDateTimeValueChange = () => {
        handleDateTimePopClose()
        // Default to Zero seconds on chnange. 
        uncommittedDateTimeValue.setSeconds(0);
        handleDateTimeValueChange(uncommittedDateTimeValue)
    };

    return (
        <Grid item xs={12} >

        

                {/* Select Stream Live / OnDemand */}
                <FormControl sx={{ mt: 2, ml: 1 }}>
                    <InputLabel
                        id="stream-type-select-label"
                    >
                        Mode
                    </InputLabel>
                    <Select
                        labelId="stream-mode-select-label"
                        id="stream-mode-select"
                        value={streamModeState}
                        autoWidth
                        onChange={handleStreamModeChange}
                        input={<OutlinedInput size="small" label="Mode" />}
                    >
                        <MenuItem
                            key={`item-mode-live`}
                            value={'LIVE'}
                        > Live
                        </MenuItem>

                        <MenuItem
                            key={`item-mode-live`}
                            value={'LIVE_REPLAY'}
                        > Live-Replay
                        </MenuItem>

                        <MenuItem
                            key={`item-mode-on-demand`}
                            value={'ON_DEMAND'}
                        > On-Demand
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Select Timestamp Mode */}
                <FormControl
                    sx={{ mt: 2, ml: 1 }}
                    disabled={streamModeState == 'LIVE'}
                >
                    <InputLabel
                        id="timestamp-select-label"
                    >
                        Timestamp
                    </InputLabel>
                    <Select
                        labelId="timestamp-select-label"
                        id="timestamp-select"
                        value={timestampModeState}
                        autoWidth
                        onChange={handleTimestampModeChange}
                        input={<OutlinedInput size="small" label="Timestamp" />}

                    >
                        <MenuItem
                            key={`item-type-producer`}
                            value={'PRODUCER_TIMESTAMP'}
                        > Producer
                        </MenuItem>

                        <MenuItem
                            key={`item-type-server`}
                            value={'SERVER_TIMESTAMP'}
                        > Server
                        </MenuItem>

                    </Select>
                </FormControl>

                {/* Timestamp Value Display */}
                <FormControl
                    variant="outlined"
                    sx={{ mt: 2, ml: 1, width: 260 }}
                    disabled={streamModeState == 'LIVE'}
                >
                    <InputLabel htmlFor="outlined-adornment-datetime" >Date/Time</InputLabel>
                    <OutlinedInput
                        id="outlined-adornment-datetime"
                        value={(dateTimeValueState).toString().slice(0, 24)}
                        size="small"
                        readOnly
                        fullWidth
                        endAdornment={
                            <InputAdornment position="end" >
                                <IconButton
                                    aria-label="video stream time"
                                    onClick={handleDateTimePopOpen}
                                    edge="end"
                                    disabled={streamModeState == 'LIVE'}
                                >
                                    <AccessTimeIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                        label="Date/Time"
                    />
                </FormControl>

                <Popover
                    id={id}
                    open={dateTimePopOpen}
                    anchorEl={anchorEl}
                    onClose={handleDateTimePopClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <Box sx={{ m: 1 }}>
                        <Typography color="primary" fontSize="small" sx={{ mb: 2 }}>Enter Start Date / Time: </Typography>

            
                        <br />
                        <Box styles={styles.rightAlign}>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1 }}
                                onClick={handleDateTimePopClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCommitDateTimeValueChange}
                            >
                                OK
                            </Button>
                        </Box>
                    </Box>

                </Popover>


        </Grid>
    )
}