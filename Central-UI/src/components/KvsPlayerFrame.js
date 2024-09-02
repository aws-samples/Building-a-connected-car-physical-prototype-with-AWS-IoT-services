// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from 'react'
import Grid from '@mui/joy/Grid';
import Typography from '@mui/joy/Typography';

import { useSnackbar } from 'notistack';


import KvsPlayer from './KvsPlayer'
//import KvsPlayerStats from './KvsPlayerStats'
import KvsPlayerController from './KvsPlayerController'
import KvsPlayerStreamSelector from './KvsPlayerStreamSelector'

import { Live, LiveReplay, OnDemand, ListFragementsInput } from '../assets/data'

// AWS Kinesis SDK
import { GetDataEndpointCommand } from "@aws-sdk/client-kinesis-video";

import {
    KinesisVideoArchivedMediaClient,
    GetHLSStreamingSessionURLCommand,
} from "@aws-sdk/client-kinesis-video-archived-media";



import { fetchAuthSession } from 'aws-amplify/auth';

const styles = {
    videoDisplayGrid: {
        border: "1px solid grey",
    }
}

let refreshHlsUrlObjects = false;
let errorCountHlsUrlRequest = 0;
let maxRetryHlsUrlRequest = 3;

export default function KvsPlayerFrame({ kvsRegionClient, kvsStream, key, region }) {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // AWS KVS SDK objects. Maintain in state to save multiule slow calls to API.
    const [kvsHlsEndpointState, setKvsHlsEndpointState] = useState(null);
    const [kvsHlsKVAMClientState, setKvsHlsKVAMClientState] = useState(null);

    // React Player state params
    const [playerRef, setPlayerRef] = useState('');
    const [hlsUrl, setHlsUrl] = useState();
    const [isPlaying, setIsPlaying] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1.1);
    const [seekToAfterRefresh, setSeekToAfterRefresh] = useState(null);

    // HLS Session / Stream settings
    const [streamModeState, setStreamModeState] = useState('LIVE');
    const [timestampModeState, setTimestampModeState] = useState('PRODUCER_TIMESTAMP');
    const [dateTimeValueState, setDateTimeValueState] = useState(new Date());
    // On initial render, request HLS URL for stream using default LIVE stream settings
    useEffect(() => {
        createHlsSessionCurrentState();
    }, []);

    // Media telemetery stats
    const [mediaStats, setMediaStats] = useState({
        currentFragTime: new Date(),
        bitrate: "N/A",
        frameRate: "N/A",
        resolution: "N/A",
        fragNumber: "N/A",
        fragDuration: "N/A"
    });

    /**
         * Takes a React ref from the ReactPlayer component that exposes 
         * a number of events and functions as well as the Media player itself. 
         * Is set when a Media Stream playing begins. 
         * 
         * @param {*} playerRef 
         */
    const updatePlayerRef = (playerRef) => {

        setPlayerRef(playerRef)

        const hlsPlayer = playerRef.getInternalPlayer('hls');

        // seekToAfterRefresh is a state var that requests new players rendered
        // jump to a specific time in the HLS Session.
        if (seekToAfterRefresh) {
            hlsPlayer.startLoad(seekToAfterRefresh)
            setSeekToAfterRefresh(null);
        }

        // Set updates for On Fragement Changed event of HLS.JS player
        hlsPlayer.on('hlsFragChanged', (event, data) => {

            const currentLevelIndex = hlsPlayer.currentLevel
            const currentLevel = hlsPlayer.levels[currentLevelIndex]

            const fragDateTime = new Date(data.frag.programDateTime).toString().slice(0, 24);
            setDateTimeValueState(new Date(data.frag.programDateTime));

            setMediaStats({
                currentFragTime: data.frag.programDateTime,
                bitrate: currentLevel ? (currentLevel.bitrate / 1024).toFixed(2) : "N/A",
                frameRate: currentLevel ? currentLevel.attrs['FRAME-RATE'] : "N/A",
                resolution: currentLevel ? currentLevel.attrs.RESOLUTION : "N/A",
                fragNumber: data.frag.sn,
                fragDuration: data.frag.duration.toFixed(2)
            });
        });

        // Handle errors at fragement level from HLS Player 
        hlsPlayer.on('hlsError', function (event, data) {

            if (data.type === 'networkError') {

                // Check if response (opposed to timeout) received wih error and handle
                if (data.response && data.response.code == 403) createHlsSessionCurrentState();

            } else if (data.type === 'mediaError') {

                console.log(`${kvsStream.StreamName} HLS Media Error.`)
                console.log(data)
            }
        });
    };


    //=============================================
    // Stream / Timestamp Mode and Time Vakue change handlers
    const handleStreamModeChange = (event) => {

        const streamMode = event.target.value
        setStreamModeState(streamMode)

        // If setting to On-Demand, ensure set start time is at least -1H behind Live
        if (streamMode === 'ON_DEMAND') {
            const now = new Date()
            const secDiffToLive = (now - dateTimeValueState) / 1000

            if (secDiffToLive < 3600) {
                dateTimeValueState.setHours(dateTimeValueState.getHours() - 1)
            }
        }

        createHlsSession(streamMode, timestampModeState, dateTimeValueState)
    };
    const handleTimestampModeChange = (event) => {

        const timestampMode = event.target.value
        setTimestampModeState(timestampMode)
        createHlsSession(streamModeState, timestampMode, dateTimeValueState)
    };
    const handleDateTimeValueChange = (dateTimeValue) => {

        // Check start tie is not in the future
        const now = new Date()
        if (dateTimeValue > now) {
            const msg = `${kvsStream.StreamName}\nCan't request start Date / Time in the future`;
            enqueueSnackbar(msg, { variant: 'warning', style: { whiteSpace: 'pre-line' } })
            return;
        }

        setDateTimeValueState(dateTimeValue)
        createHlsSession(streamModeState, timestampModeState, dateTimeValue)
    };

    //=============================================
    // Stream Fastforward / Rewind Scrubber functions
    const handleTimeShiftChange = (secsShift) => {

        const currPlayerTime = playerRef.getCurrentTime();
        let seekToPlayerTime = currPlayerTime + secsShift;

        // if On-Demand and rewind past start then request a new 
        // Stream at 1/2 max fragements in past and reset player start
        // time to what was requested.
        if ((streamModeState === 'ON_DEMAND') && seekToPlayerTime < 0) {

            const fragDuration = mediaStats.fragDuration;
            const maxFrags = 1000
            const halfMaxFragSecs = fragDuration * (maxFrags / 2);
            const startStreamTimeStamp = new Date(dateTimeValueState - (halfMaxFragSecs * 1000));

            // Request HLS Session with new start Time stamp.
            handleDateTimeValueChange(startStreamTimeStamp);

            // Save in seconds where the player should jump to. 
            // is saved in state and applied when the new stream is loaded. 
            seekToPlayerTime = halfMaxFragSecs + secsShift
            setSeekToAfterRefresh(seekToPlayerTime);

        } else {

            playerRef.seekTo(seekToPlayerTime)
        }
    };
    //=============================================
    // Progress monitor and auto request next HLS stream time window
    const handleMediaProgress = (playerProgress) => {

        // Request new HLS Stream at current playing time if On-Demand mode and reached end of frame list.
        if (streamModeState == 'ON_DEMAND' && playerProgress.played >= .99) {
            console.log(`KVS Stream: ${kvsStream.StreamName}  On Demand reached 99% played, requestng new HLS Session`);
            createHlsSessionCurrentState();
        }
    };

    //console.log("kvsStream", kvsRegionClient, kvsStream, key)
    //=============================================
    // KVS Control plane actions and helpers (Get HLS URL, Get Fragement lists)
    const createHlsSessionCurrentState = () => {
        createHlsSession(streamModeState, timestampModeState, dateTimeValueState);
    };
    /**
     * Called to updated HLS URL request when any of the Mode, Timestamp 
     * has been updatwd by the user.
     * 
     * Also called programatically when the HLS stream needs refreshing such as when 
     * the previous session is about to expire or whan an on-demand session is reaching 
     * the start of the end of the fragement list due ti playing or scrubbibg actions. 
     * 
     * @param {*} streamModeState 
     * @param {*} timestampModeState 
     * @param {*} dateTimeValueState 
     */
    const createHlsSession = (streamModeState, timestampModeState, dateTimeValueState) => {

        let videoArchiveInput = {};

        if (streamModeState == 'LIVE') {
            videoArchiveInput = Live(kvsStream.StreamARN)

        } else if (streamModeState == 'LIVE_REPLAY') {
            videoArchiveInput = LiveReplay(kvsStream.StreamARN, timestampModeState, dateTimeValueState)

        } else if (streamModeState == 'ON_DEMAND') {
            videoArchiveInput = OnDemand(kvsStream.StreamARN, timestampModeState, dateTimeValueState)
        }
        // Update the HLS URL based on new stream selector inputs
        apiRequestHlsUrl(videoArchiveInput)

    };



    const apiRequestHlsUrl = async (videoArchiveInput) => {

        try {

            // If refreshHlsUrlObjects requested or no previous kvsEndpoint create and set to state.
            let kvsEndpoint = null;
            console.log(`refreshHlsUrlObjects: ${refreshHlsUrlObjects}`)
            console.log(`kvsHlsEndpointState: ${kvsHlsEndpointState}`)
            if (refreshHlsUrlObjects || !kvsHlsEndpointState) {
                kvsEndpoint = await getKvsEndpoint("GET_HLS_STREAMING_SESSION_URL");
                console.log(kvsEndpoint)
                setKvsHlsEndpointState(kvsEndpoint)

            } else {
                kvsEndpoint = kvsHlsEndpointState;
            }

            // If refreshHlsUrlObjects requested or no previous KVS Archive Media Client create and set to state.
            let kvsVAMClient = null;
            if (refreshHlsUrlObjects || !kvsHlsKVAMClientState) {
                kvsVAMClient = await getKvsArchiveClient(kvsEndpoint);
                setKvsHlsKVAMClientState(kvsVAMClient);

            } else {
                kvsVAMClient = kvsHlsKVAMClientState;
            }

            //=========================================
            // Get the KVS HLS URL for this stream and settings
            console.log(`\n${new Date} - ${kvsStream.StreamName} Get HLS URL Request Input: ${JSON.stringify(videoArchiveInput)}`);

            //Create / Send the Get HLS URL Command for this stream
            const kvsVamGetHlsCommand = new GetHLSStreamingSessionURLCommand(videoArchiveInput);

            console.log("GetHLSStreamingSessionURLCommand")
            const hlsUrlResponse = await kvsVAMClient.send(kvsVamGetHlsCommand);

            //Validate hlsUrlResult.httpStatusCode / handle errors.
            const hlsUrlStatusCode = hlsUrlResponse.httpStatusCode;
            if (hlsUrlStatusCode < 200 || hlsUrlStatusCode > 299) {
                throw `Error Requesting HLS URL\nError Response: ${hlsUrlResponse}`
            }

            const hlsUrl = hlsUrlResponse.HLSStreamingSessionURL;
            console.log(`\n${new Date} - ${kvsStream.StreamName} Get HLS URL Result: ${hlsUrl}`);

            // Reset error counts and watchdogs for request new HLS Session. 
            refreshHlsUrlObjects = false
            errorCountHlsUrlRequest = 0;

            // Set the HLS URL State
            setHlsUrl(hlsUrl);

        } catch (error) {

            console.log('GET API REQUEST ERRROR:');
            console.log(error);

            // Get HLS URL request fails.\, try again up to maxRetryHlsUrlRequest times
            errorCountHlsUrlRequest += 1;

            if (errorCountHlsUrlRequest <= maxRetryHlsUrlRequest) {

                let msg = `${new Date} - ${kvsStream.StreamName}: Error on Get HLS URL: ${error}`;
                msg += ` - Retrying for ${errorCountHlsUrlRequest} of ${maxRetryHlsUrlRequest} attempts.`;
                console.log(msg);
                refreshHlsUrlObjects = true
                apiRequestHlsUrl(videoArchiveInput)

                // Else error and notify user
            } else {

                // Set a unreachable placeholder URL to let ReactPlayer
                // fail and display can't access stream message instead of continuing 
                // to play any previous and forces media player to own the same space in the UI. 
                setHlsUrl('bad.placeholder.url');
                refreshHlsUrlObjects = false

                // Update user of error with notificaton
                const msg = `${kvsStream.StreamName}: Error on Get HLS URL: ${error}\nSee console logs for more detail.`;
                enqueueSnackbar(msg, { variant: 'warning', style: { whiteSpace: 'pre-line' } })
                console.log(`${new Date} - ${msg}`)
            }
        }
    };

    const getKvsEndpoint = async (apiName) => {

        //=========================================
        // Get the KVS client for current selected region
        const kvsClient = kvsRegionClient;

        //=========================================
        // Get the KVS Stream Endpoint

        // Endpoint request inputs
        const epInputs = {
            APIName: apiName,
            StreamARN: kvsStream.StreamARN
        };

        // Create and send the DataEndpointCommand 
        console.log(`\n${new Date} - ${kvsStream.StreamName} Get Endpoint Request Input: ${JSON.stringify(epInputs)}`);
        const epCommand = new GetDataEndpointCommand(epInputs);
        const kvsEndpointResponse = await kvsClient.send(epCommand);

        //Validate kvsEndpointResponse.httpStatusCode / handle errors.
        const epStatusCode = kvsEndpointResponse.httpStatusCode;
        if (epStatusCode < 200 || epStatusCode > 299) {
            throw `Error Requesting KVS Endpoint\nError Response: ${kvsEndpointResponse}`;
        }

        const kvsEndpoint = kvsEndpointResponse.DataEndpoint;
        console.log(`\n${new Date} - ${kvsStream.StreamName} Get Endpoint Result: ${JSON.stringify(kvsEndpoint)}`);
        return kvsEndpoint;

    };



    const getKvsArchiveClient = async (kvsEndpoint) => {

        //=========================================
        // Create the Kinesis Video Archive Media Client
        // Note: calling Auth.currentCredentials() will also refresh the session token if needed.
        const { credentials } = await fetchAuthSession()

        const kvsVAMClient = new KinesisVideoArchivedMediaClient({
            region: region,
            credentials: credentials,
            endpoint: kvsEndpoint
        });

        console.log(`\n${new Date} - ${kvsStream.StreamName} Get KVAM Client Result: ${JSON.stringify(kvsVAMClient)}`);
        return kvsVAMClient;
    }
    //=============================================
    // JSX Render
    return (<KvsPlayer
        hlsUrl={hlsUrl}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        updatePlayerRef={updatePlayerRef}
        handleMediaProgress={handleMediaProgress}
    />)

       

   
       


       
  
}
