import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { type SyntheticEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import NotificationSettings from './NotificationSettings';
import Schedules from './Schedules';
import Sources from './Sources';
import Targets from './Targets';

export default function Configuration() {
  const location = useLocation();
  const navigate = useNavigate();
  const expanded = location.hash.substring('#'.length);

  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      navigate({ hash: isExpanded ? panel : undefined }, { replace: true });
    };

  return (
    <Container sx={{ paddingTop: 2 }}>
      <Accordion
        expanded={expanded === 'sources'}
        onChange={handleChange('sources')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="sources-content"
          id="sources-header"
        >
          <Typography component="span">Sources</Typography>
        </AccordionSummary>

        <Sources />
      </Accordion>

      <Accordion
        expanded={expanded === 'targets'}
        onChange={handleChange('targets')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="targets-content"
          id="targets-header"
        >
          <Typography component="span">Targets</Typography>
        </AccordionSummary>

        <Targets />
      </Accordion>

      <Accordion
        expanded={expanded === 'schedules'}
        onChange={handleChange('schedules')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="schedules-content"
          id="schedules-header"
        >
          <Typography component="span">Schedules</Typography>
        </AccordionSummary>

        <Schedules />
      </Accordion>

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

        <NotificationSettings />
      </Accordion>
    </Container>
  );
}
