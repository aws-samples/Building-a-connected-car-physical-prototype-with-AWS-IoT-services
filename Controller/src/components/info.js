import React from "react";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Card from "@mui/joy/Card";
import CardCover from "@mui/joy/CardCover";
import CardContent from "@mui/joy/CardContent";
import SpeedIcon from "@mui/icons-material/Speed";
import Battery3BarIcon from "@mui/icons-material/Battery3Bar";
import PlaceIcon from "@mui/icons-material/Place";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import Colors from "../Colors.js";
import Map from "./map.js";

function Info(props) {
  const { coordinates } = props
  return (
    <Card

      sx={{
        height: "100%", marginLeft: 2,
        bgcolor: Colors.primary,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      variant='plain'
    >
      <Stack
        direction='row'
        justifyContent="flex-start"
        alignItems='center'
        sx={{ width: "100%" }}
        spacing={1}
      >
        <List
          sx={{
            width: "100%",
            maxWidth: 360,
          }}
        >
          <ListItem>
            <ListItemDecorator>
              <PlaceIcon
                sx={{ fontSize: 40, color: "orange", marginRight: 2 }}
              />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level='title-sm' sx={{ color: "#fff" }}>
                Coordinates
              </Typography>
              <Typography level='body-sm' sx={{ color: "orange" }}>
                {
                  "Longitude: " + coordinates[0]
                }
              </Typography>
              <Typography level='body-sm' sx={{ color: "orange" }}>
                {
                  "Latitude: " + coordinates[1]
                }
              </Typography>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemDecorator>
              <SpeedIcon
                sx={{ fontSize: 40, color: "orange", marginRight: 2 }}
              />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level='title-md' sx={{ color: "white" }}>
                Speed
              </Typography>
              <Typography level='body-md' sx={{ color: "orange" }}>
                {props.speed}
              </Typography>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemDecorator>
              <Battery3BarIcon
                sx={{ fontSize: 40, color: "orange", marginRight: 2 }}
              />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level='title-md' sx={{ color: "#fff" }}>
                Battery
              </Typography>
              <Typography level='body-md' sx={{ color: "orange" }}>
                {props.battery}
              </Typography>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemDecorator>
              <CompareArrowsIcon
                sx={{ fontSize: 40, color: "orange", marginRight: 2 }}
              />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level='title-md' sx={{ color: "#fff" }}>
                Distance
              </Typography>
              <Typography level='body-md' sx={{ color: "orange" }}>
                {props.distance}
              </Typography>
            </ListItemContent>
          </ListItem>
        </List>
        <Card sx={{ width: "70%", height: "35vh" }} variant='outlined'>
          <CardCover >
            <Map coordinates={coordinates} />
          </CardCover>
          <CardContent></CardContent>
        </Card>
      </Stack>
    </Card >
  );
}

export default Info;
