const styles = {

    container: {
        alignItems: "center",
        display: 'flex',
        justifyContent: 'center',
        margin: "0 auto"
    },

    listItemCustomColor0: {
        display: "flex",
        justifyContent: 'flex-end',
        padding: "25px",
        //borderBottom: "1px solid  rgba(255,255,255,0.7)",
        color: "rgb(23, 107, 135)",
        backdropFilter: "blur(11px)",
        boxShadow: "0 20px px 0 rgba(0, 0, 0, 0.18)",
        marginBottom: "15px",
        background: "rgb(63,81,181)",
        background: "linear-gradient(45deg, rgb(63,81,181) 0%, rgba(92, 107, 192, 1) 100%)",
        marginLeft: "10px",
        fontWeight: "500",
        borderRadius: "10px"

    },
    listItemCustomColor1: {
        display: "flex",
        justifyContent: 'flex-end',
        padding: "25px",
        color: "rgb(23, 107, 135)",

        //borderBottom: "1px solid  rgba(255,255,255,0.7)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.18)",
        marginBottom: "15px",
        backdropFilter: "blur(11px)",
        background: "rgb(40, 53, 147)",
        background: "linear-gradient(45deg, rgba(40, 53, 147, 1) 0%, rgba(121, 134, 203, 1) 100%)",
        marginLeft: "10px",
        fontWeight: "500",
borderRadius:"10px"
    },
    listTypographyCustom: {
        fontSize: 25,
        color:"#E8EAF6",
        fontWeight:"500"

    },
    iconCustom: {
        fontSize: 50,
        color: "#E8EAF6",
        padding: "0px 10px 0px 10px"
    },
    iconCustomNav: {
        fontSize: 25,
        color: "#1A237E",

    },
    itemLeft: {
        marginRight: "auto"
    },
    title: {
        marginBottom: "2%",
        color: "#1A237E",
        fontWeight: "bold",
        fontSize: "25px",

    },
    glass:{
        padding: "2px",
        backdropFilter: "blur(11px)",
        borderRadius: "10px",
        background: "rgb(255, 255, 255, 0.7)",
        fontWeight: "500",
        /* Setting the size of the upper layer to 80% of the screen size*/

    },
    logoBarBase:{
        color:"white",
        fontSize:"35px",
        "&:hover":{
            color: "white",
            background: "none",
            pointer:"none"

        }

    },
        headerBarBase: {
        color: "white",
        fontSize: "25px",
            "&:hover": {
                color: "#1A237E",
                background: "red",


            }

    },
    avatarBarBase: { border: "2px solid white", "&:hover": { border: "2px solid red" } },
    primaryColor: {
        color: "#1A237E",
}
};

export default styles