// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'
import {
    Grid,
    Box,
    FormControl,
    Select,
    MenuItem,
    IconButton,
} from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardOutlinedIcon from '@mui/icons-material/FastForwardOutlined';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindOutlinedIcon from '@mui/icons-material/FastRewindOutlined';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';

export default function KvsPlayerController(props) {

    const { isPlaying, setIsPlaying, playbackRate, setPlaybackRate, handleTimeShiftChange } = props;

    const handlePlayPauseClicked = () => {
        setIsPlaying(!isPlaying);
    }

    const handlePlaybackRateChanged = (event) => {
        setPlaybackRate(event.target.value)
    }

    return (
        <Grid container>

            {/* React Player Controls */}
            <Grid item xs={12} >

                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(-300)} >
                        <FastRewindIcon color="primary" fontSize="large" />
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(-60)} >
                        <FastRewindOutlinedIcon color="primary" fontSize="large" />
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(-10)} >
                        <Replay10Icon color="primary" fontSize="large" />
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={handlePlayPauseClicked} >
                        {isPlaying ?
                            <PauseIcon color="primary" fontSize="large" /> :
                            <PlayArrowIcon color="primary" fontSize="large" />
                        }
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(10)} >
                        <Forward10Icon color="primary" fontSize="large" />
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(60)} >
                        <FastForwardOutlinedIcon color="primary" fontSize="large" />
                    </IconButton>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={() => handleTimeShiftChange(300)} >
                        <FastForwardIcon color="primary" fontSize="large" />
                    </IconButton>


                    <FormControl variant="standard" sx={{ m: 1 }}>
                        <Select
                            id="playback-rate-select"
                            value={playbackRate}
                            onChange={handlePlaybackRateChanged}
                        >
                            <MenuItem value={1}>x1</MenuItem>
                            <MenuItem value={1.05}>x1.05</MenuItem>
                            <MenuItem value={1.1}>x1.1</MenuItem>
                            <MenuItem value={1.2}>x1.2</MenuItem>
                            <MenuItem value={1.5}>x1.5</MenuItem>
                            <MenuItem value={2}>x2</MenuItem>
                            <MenuItem value={3}>x3</MenuItem>
                            <MenuItem value={4}>x4</MenuItem>
                            <MenuItem value={5}>x5</MenuItem>
                        </Select>
                    </FormControl>


                </Box>

            </Grid>

        </Grid>
    )
}