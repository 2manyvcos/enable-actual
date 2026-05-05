import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useMemo, type SyntheticEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { output } from 'zod';
import type Issue from '@shared/schema/Issue';
import Issues from './Issues';
import NotificationSettings from './NotificationSettings';
import Reports from './Reports';
import Schedules from './Schedules';
import Sources from './Sources';
import Targets from './Targets';

export default function Configuration() {
  const location = useLocation();
  const navigate = useNavigate();
  const expanded = location.hash.substring('#'.length);

  const issueResource = useResource<
    FetchProviderType,
    output<typeof Issue>[] | undefined
  >({
    name: 'v1/issues',
    query: undefined,
    events: true,
  });

  const issuesByResource = useMemo(
    () => Object.groupBy(issueResource.data ?? [], ({ resource }) => resource),
    [issueResource.data],
  );

  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      navigate({ hash: isExpanded ? panel : undefined }, { replace: true });
    };

  return (
    <Container sx={{ paddingTop: 2 }}>
      <Issues
        isLoading={issueResource.isLoading && issueResource.isInitial}
        error={issueResource.error}
        notify={issueResource.notify}
        data={issueResource.data}
      />

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

        <Sources issues={issuesByResource['sources']} />
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

        <Targets issues={issuesByResource['targets']} />
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

        <Schedules issues={issuesByResource['schedules']} />
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

      <Accordion
        expanded={expanded === 'reports'}
        onChange={handleChange('reports')}
        slotProps={{ transition: { unmountOnExit: true } }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="reports-content"
          id="reports-header"
        >
          <Typography component="span">Import History</Typography>
        </AccordionSummary>

        <Reports />
      </Accordion>
    </Container>
  );
}
