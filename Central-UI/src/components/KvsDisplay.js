import React, { useState, useEffect } from 'react'
import Grid from '@mui/joy/Grid';
import KvsPlayerFrame from "../components/KvsPlayerFrame"
//import KvsWebViewerQuickstart from '../components/KvsWebViewerQuickstart'


import { fetchAuthSession } from 'aws-amplify/auth';
// AWS Kinesis SDK objects
import {
    KinesisVideoClient,
    DescribeStreamCommand
} from "@aws-sdk/client-kinesis-video";



export default function VideoDisplay({ car }) {
    const [kvsStream, setKvsStream] = useState([]);
    const [kvsRegionClient, setKvsRegionClient] = useState();
    const region = "eu-central-1"

    React.useEffect(() => {
        fetchAuthSession().then(async (data) => {
            const kvsRegionClient = new KinesisVideoClient({
                region: region,
                credentials: data.credentials
            });

            const inputs = {
                StreamName: car
            };

            setKvsRegionClient(kvsRegionClient)
            // Create and process the KVS ListStreamsCommand in selected Region.
            const command = new DescribeStreamCommand(inputs);
            kvsRegionClient.send(command).then(async (data) => {
                setKvsStream(data.StreamInfo)
            });
        });

    }, [car]);

    //    const classes = useStyles();

    return (

        /* Display all of the selected KVS Streams  */
        <Grid
            item
            key={`grid-item-${kvsStream.StreamName}`}
            //className={classes.videoDisplayGrid}
            xs={12}
        >
            <KvsPlayerFrame
                key={`kvs-player-${kvsStream.StreamName}`}
                kvsStream={kvsStream}
                kvsRegionClient={kvsRegionClient}
                region={region}
            />
        </Grid>


    )
}