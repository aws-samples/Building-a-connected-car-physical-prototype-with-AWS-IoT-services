/*
HLS.js media player fine tuning configurations applied during stream view initialisation.
For parameter detail see:
https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning

Some tuning has been applied to improve latency, adjust these according to fragment duration.
*/

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

var hlsConfig = {
    autoStartLoad: true,
    startPosition: -1,
    debug: false,
    capLevelOnFPSDrop: false,
    capLevelToPlayerSize: false,
    defaultAudioCodec: undefined,
    initialLiveManifestSize: 1,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    backBufferLength: Infinity,
    maxBufferSize: 60 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 2,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 3,
    maxFragLookUpTolerance: 0.25,
    liveSyncDuration: undefined,            // Duration in seconds, don't use with DurationCount params below
    liveMaxLatencyDuration: undefined,      // Duration in seconds, don't use with DurationCount params below
    liveSyncDurationCount: 2,               // Customised from default to optimise latency
    liveMaxLatencyDurationCount: 3,         // Customised from default to optimise latency
    liveDurationInfinity: false,
    enableWorker: true,
    enableSoftwareAES: true,
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 1,
    manifestLoadingRetryDelay: 1000,
    manifestLoadingMaxRetryTimeout: 64000,
    startLevel: undefined,
    levelLoadingTimeOut: 10000,
    levelLoadingMaxRetry: 4,
    levelLoadingRetryDelay: 1000,
    levelLoadingMaxRetryTimeout: 64000,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 6,
    fragLoadingRetryDelay: 1000,
    fragLoadingMaxRetryTimeout: 64000,
    startFragPrefetch: false,
    testBandwidth: true,
    progressive: false,
    lowLatencyMode: true,
    fpsDroppedMonitoringPeriod: 5000,
    fpsDroppedMonitoringThreshold: 0.2,
    appendErrorMaxRetry: 3,
    // loader: customLoader,
    // fLoader: customFragmentLoader,
    // pLoader: customPlaylistLoader,
    // xhrSetup: XMLHttpRequestSetupCallback,
    // fetchSetup: FetchSetupCallback,
    // abrController: AbrController,
    // bufferController: BufferController,
    // capLevelController: CapLevelController,
    // fpsController: FPSController,
    // timelineController: TimelineController,
    enableWebVTT: true,
    enableIMSC1: true,
    enableCEA708Captions: true,
    stretchShortVideoTrack: false,
    maxAudioFramesDrift: 1,
    forceKeyFrameOnDiscontinuity: true,
    abrEwmaFastLive: 3.0,
    abrEwmaSlowLive: 9.0,
    abrEwmaFastVoD: 3.0,
    abrEwmaSlowVoD: 9.0,
    abrEwmaDefaultEstimate: 500000,
    abrBandWidthFactor: 0.95,
    abrBandWidthUpFactor: 0.7,
    abrMaxWithRealBitrate: false,
    maxStarvationDelay: 4,
    maxLoadingDelay: 4,
    minAutoBitrate: 0,
    emeEnabled: false,
    widevineLicenseUrl: undefined,
    licenseXhrSetup: undefined,
    drmSystemOptions: {},
    // requestMediaKeySystemAccessFunc: requestMediaKeySystemAccess,
};

export { hlsConfig };