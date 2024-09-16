import React from "react";
import Card from "@mui/joy/Card";
import { socket } from "../socket";
import "./control-wheels.css";
import Colors from "../Colors";

function Control() {

  function mouseDownHandler(event) {
    var direction = event.target.dataset.direction;
    sendDir(direction);
  }

  function mouseUpHandler(event) {
    const stop_command = "stop";
    sendDir(stop_command);
  }

  function sendDir(dir) {
    socket.emit("move", dir);
  }

  return (
    <Card

      sx={{
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        bgcolor: Colors.primary,


      }}
    >

      <div class="d-pad-wheel">
        <div class="d-pad-wheel-up"
          data-direction='up'
          onMouseDown={mouseDownHandler}
          onMouseUp={mouseUpHandler}
        >

        </div>
        <div class="d-pad-wheel-left"
          data-direction='left'
          onMouseDown={mouseDownHandler}
          onMouseUp={mouseUpHandler}
        ></div>
        <div class="d-pad-wheel-right"
          data-direction='right'
          onMouseDown={mouseDownHandler}
          onMouseUp={mouseUpHandler}
        ></div>
        <div class="d-pad-wheel-down"

          data-direction='down'
          onMouseDown={mouseDownHandler}
          onMouseUp={mouseUpHandler}
        ></div>
        <div class="d-pad-wheel-center"></div>
      </div>

    </Card>
  );
}

export default Control;
