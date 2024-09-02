import * as React from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Avatar from '@mui/joy/Avatar';
import Button from '@mui/joy/Button';
import Tooltip from '@mui/joy/Tooltip';
import Dropdown from '@mui/joy/Dropdown';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import ListDivider from '@mui/joy/ListDivider';
import SyncTwoToneIcon from '@mui/icons-material/SyncTwoTone';
import SyncDisabledTwoToneIcon from '@mui/icons-material/SyncDisabledTwoTone';
import CellTowerIcon from '@mui/icons-material/CellTower';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { getCurrentUser } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';
import styles from './styles';

async function handleSignOut() {

    try {
        await signOut();
    } catch (error) {
        console.log('error signing out: ', error);

    }

}


function AutoRefresh({ autoRefresh, clickFunction }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return <IconButton size="sm" variant="outlined" color="primary" />;
    }
    return (
        <Tooltip title="Auto Refresh" >
            <IconButton
                style={styles.headerBarBase}
                id="toggle-mode"
                size="sm"
                sx={{ alignSelf: 'center' }}
                onClick={() => {
                    clickFunction()

                }}
            >
                {autoRefresh ? <SyncTwoToneIcon style={styles.headerBarBase} /> : <SyncDisabledTwoToneIcon style={styles.headerBarBase} />}
            </IconButton>
        </Tooltip>
    );
}
export default function Header({ autoRefresh = false, clickFunction }) {
    const [open, setOpen] = React.useState(false);
    const [user, setUser] = React.useState("");
    React.useEffect(() => {
        getCurrentUser().then((response) => {
            const { username, userId, signInDetails } = response
            setUser(username)
        });


    });


    return (
        <Box
            sx={{
                display: 'flex',
                flexGrow: 1,
                justifyContent: 'space-between',
            }}
        >
            <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={1}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
            >

                <CellTowerIcon style={styles.logoBarBase} />
                <Button
                    component="a"
                    href="/"
                    size="sm"
                    sx={{ alignSelf: 'center', color: '#1A237E', bgcolor: '#C5CAE9', "&:hover": { bgcolor: '#7986CB' } }}
                >
                    Vehicles
                </Button>
            </Stack>


            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1.5,
                    alignItems: 'center',
                }}
            >
                <AutoRefresh autoRefresh={autoRefresh} clickFunction={clickFunction} />
                <Dropdown>
                    <MenuButton


                        size="sm"
                        sx={{ maxWidth: '48px', maxHeight: '48px', borderRadius: '9999999px' }}
                    >
                        <Avatar
                            style={styles.avatarBarBase}
                            src="/user.png"
                            sx={{ maxWidth: '48px', maxHeight: '48px' }}
                        />
                    </MenuButton>
                    <Menu>
                        <ListDivider />
                        <MenuItem onClick={handleSignOut}>
                            <LogoutRoundedIcon />
                            Log out
                        </MenuItem>
                    </Menu>
                </Dropdown>
            </Box>
        </Box>
    );
}
