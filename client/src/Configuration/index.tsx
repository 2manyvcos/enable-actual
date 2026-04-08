import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useState, type SyntheticEvent } from 'react';
import NotificationSettings from './NotificationSettings';

export default function Configuration() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Container sx={{ paddingTop: 2 }}>
      <Accordion
        expanded={expanded === 'notification-settings'}
        onChange={handleChange('notification-settings')}
        // slotProps={{ transition: { unmountOnExit: true } }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="notification-settings-content"
          id="notification-settings-header"
        >
          <Typography component="span">Notification Settings</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <NotificationSettings />
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}
