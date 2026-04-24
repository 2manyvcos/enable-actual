import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

export default function PageNotFound() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
      }}
    >
      <Stack>
        <Typography variant="h4" align="center" gutterBottom>
          Page not found
        </Typography>

        <Typography variant="body1" align="center" gutterBottom>
          The page you were looking for wasn't found.
        </Typography>

        <Divider slot="test" />

        <Button
          variant="outlined"
          sx={{ alignSelf: 'center', marginTop: 2 }}
          component={RouterLink}
          to="/"
        >
          Home
        </Button>
      </Stack>
    </Box>
  );
}
