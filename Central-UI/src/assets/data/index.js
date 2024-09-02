
// Width fo Side Drawer in UI (Prob move this to CSS or other )
const drawerWidth = 240;

/**
 * KVS Regional and KVS Regional Endpoints List
 */
const kvsRegions = [
    { region: "us-east-2", kvsEndpoint: "kinesisvideo.us-east-2.amazonaws.com" },
    { region: "us-east-1", kvsEndpoint: "kinesisvideo.us-east-1.amazonaws.com" },
    { region: "us-west-2", kvsEndpoint: "kinesisvideo.us-west-2.amazonaws.com" },
    { region: "ap-east-1", kvsEndpoint: "kinesisvideo.ap-east-1.amazonaws.com" },
    { region: "ap-south-1", kvsEndpoint: "kinesisvideo.ap-south-1.amazonaws.com" },
    { region: "ap-northeast-2", kvsEndpoint: "kinesisvideo.ap-northeast-2.amazonaws.com" },
    { region: "ap-southeast-1", kvsEndpoint: "kinesisvideo.ap-southeast-1.amazonaws.com" },
    { region: "ap-southeast-2", kvsEndpoint: "kinesisvideo.ap-southeast-2.amazonaws.com" },
    { region: "ap-northeast-1", kvsEndpoint: "kinesisvideo.ap-northeast-1.amazonaws.com" },
    { region: "ca-central-1", kvsEndpoint: "kinesisvideo.ca-central-1.amazonaws.com" },
    { region: "eu-central-1", kvsEndpoint: "kinesisvideo.eu-central-1.amazonaws.com" },
    { region: "eu-west-1", kvsEndpoint: "kinesisvideo.eu-west-1.amazonaws.com" },
    { region: "eu-west-2", kvsEndpoint: "kinesisvideo.eu-west-2.amazonaws.com" },
    { region: "eu-west-3", kvsEndpoint: "kinesisvideo.eu-west-3.amazonaws.com" },
    { region: "sa-east-1", kvsEndpoint: "kinesisvideo.sa-east-1.amazonaws.com" }
]

/**
 * 
 *  Returns the GetHLSUrl command Input shape for a Live Kinesis Video stream HLS Session.
 * 
 * @param {*} streamArn - ARN of the KVS STream to reque3st HLS URL for
 * @param {*} expires - Duration (In secs) that the HLS URL session token remains valid. Defaults to 12Hr
 * @returns 
 */
const Live = (streamArn, expires = 3600) => {
    return ({
        PlaybackMode: "LIVE",
        StreamARN: streamArn,
        DisplayFragmentTimestamp: "ALWAYS",
        DiscontinuityMode: "ON_DISCONTINUITY",
        MaxMediaPlaylistFragmentResults: 5,
        Expires: expires
    });
};

/**
 * 
 * Returns the GetHLSUrl command Input shape for a Live-Replay Kinesis Video stream HLS Session.
 * 
 * @param {*} streamArn - ARN of the KVS STream to reque3st HLS URL for
 * @param {*} selectorType - Producer or Server Timestamp.
 * @param {*} startTimestamp - Date/Timestamp of start the stream fragement.
 * @param {*} expires - Duration (In secs) that the HLS URL session token remains valid. Defaults to 12Hr

 * @returns 
 */
const LiveReplay = (streamArn, selectorType, startTimestamp, expires = 3600) => {
    return ({
        PlaybackMode: "LIVE_REPLAY",
        StreamARN: streamArn,
        DisplayFragmentTimestamp: "ALWAYS",
        DiscontinuityMode: "ON_DISCONTINUITY",
        Expires: expires,
        HLSFragmentSelector: {
            FragmentSelectorType: selectorType,
            TimestampRange: {
                StartTimestamp: startTimestamp
            }
        }
    });
};

/**
 * 
 *  Returns the GetHLSUrl command Input shape for a On-Demand Kinesis Video stream HLS Session.
 * 
 * @param {*} streamArn - ARN of the KVS STream to reque3st HLS URL for
 * @param {*} selectorType - Producer or Server Timestamp.
 * @param {*} startTimestamp - Date/Timestamp of start  fragement.
 * @param {*} endTimestamp  - Date/Timestamp of end the fragement. Defaults to current time and will request all fragements up to MAX_FRAGEMENTS
 * @param {*} expires - Duration (In secs) that the HLS URL session token remains valid. Defaults to 12Hr

 * @returns 
 */
const OnDemand = (streamArn, timestampType, startTimestamp, expires = 3600) => {


    // Request all fragements from startTimestamp to +23 Hrs from start up to KVS MAX_FRAGEMENTS
    let endTimestamp = new Date(startTimestamp) // Get timestamp as Epoch seconds number
    endTimestamp.setHours(endTimestamp.getHours() + 23)

    return ({
        PlaybackMode: "ON_DEMAND",
        StreamARN: streamArn,
        DisplayFragmentTimestamp: "ALWAYS",
        DiscontinuityMode: "ON_DISCONTINUITY",
        Expires: expires,
        HLSFragmentSelector: {
            FragmentSelectorType: timestampType,
            TimestampRange: {
                StartTimestamp: startTimestamp,
                EndTimestamp: endTimestamp
            }
        }
    });
};

const ListFragementsInput = (streamArn) => {

    // Get Start timetamp as Zero Hours Today and endTimestamp to Now
    let startTimestamp = new Date()
    startTimestamp.setHours(14)
    startTimestamp.setMinutes(0)
    startTimestamp.setSeconds(0)
    let endTimestamp = new Date()

    return ({
        StreamARN: streamArn,
        MaxResults: 10,
        FragmentSelector: {
            FragmentSelectorType: "PRODUCER_TIMESTAMP",
            TimestampRange: {
                StartTimestamp: startTimestamp,
                EndTimestamp: endTimestamp
            }
        }
    });
};

export { drawerWidth, kvsRegions, Live, LiveReplay, OnDemand, ListFragementsInput };