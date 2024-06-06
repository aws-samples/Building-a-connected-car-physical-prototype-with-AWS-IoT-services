import React, { useState, useEffect } from "react";
import Card from "@mui/joy/Card";
import CardCover from "@mui/joy/CardCover";
import CardContent from "@mui/joy/CardContent";
import { socket } from "../socket";
import Colors from "../Colors";
import "./control.css";
import Box from "@mui/joy/Box";

function Camera() {
  const [imageSource, setImageSource] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3; // Set the maximum number of retries

  useEffect(() => {
    setImageSource(imageUrl());
  }, []);

  function mouseDownHandler(event) {
    console.log(event);
    var direction = event.target.dataset.direction;
    console.log("Servo Start :: " + direction);
    sendHead(direction);
  }

  function sendHead(dir) {
    socket.emit("head", dir);
  }

  function imageUrl() {
    let url = window.location.origin + "/stream.mjpg";
    return url;
  }

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setRetryCount(retryCount + 1);
      setImageSource(null); // Reset the image source to trigger a reload
      setTimeout(() => {
        setImageSource(imageUrl());
      }, 1000); // Wait for 2 seconds before retrying
    } else {
      console.error("Maximum retries reached. Unable to load image.");
    }
  };

  return (
    <Card
      orientation="vertical"
      variant="solid"
      sx={{
        height: "100%",
        marginLeft: 2,
        bgcolor: "black",
      }}
    >
      <CardCover sx={{ height: "auto" }}>
        <Box
          sx={{
            aspectRatio: "640/480",
            maxHeight: "480px",
            bgcolor: "black",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {imageSource && (
            <img
              src={imageSource}
              alt="Camera Stream"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                border: "1px solid grey",
              }}
              onError={handleImageError}
            />
          )}
        </Box>
      </CardCover>
      <CardContent sx={{ alignItems: "self-end", justifyContent: "flex-end" }}>
        <nav className="d-pad">
          <a
            className="up"
            data-direction="up"
            onMouseDown={mouseDownHandler}
          ></a>
          <a
            className="right"
            data-direction="right"
            onMouseDown={mouseDownHandler}
          ></a>
          <a
            className="down"
            data-direction="down"
            onMouseDown={mouseDownHandler}
          ></a>
          <a
            className="left"
            data-direction="left"
            onMouseDown={mouseDownHandler}
          ></a>
        </nav>
      </CardContent>
    </Card>
  );
}

export default Camera;