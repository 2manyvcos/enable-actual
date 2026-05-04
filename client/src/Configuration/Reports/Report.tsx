import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HideSourceIcon from '@mui/icons-material/HideSource';
import ReportIcon from '@mui/icons-material/Report';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router';
import { type output } from 'zod';
import { gotoReports, previewReport } from '@/actions/reports';
import { previewSchedule } from '@/actions/schedules';
import type ImportReport from '@shared/schema/ImportReport';
import { stringifyError } from '@shared/utils';

export default function Report({
  data,
}: {
  data: output<typeof ImportReport>;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preview = searchParams.get('preview');
  const previewID = preview?.startsWith('report:')
    ? preview.substring('report:'.length)
    : undefined;

  return (
    <Accordion
      expanded={previewID === data.id}
      onChange={(_event, isExpanded) => {
        if (!isExpanded) gotoReports({ navigate });
        else previewReport({ navigate, reportID: data.id });
      }}
      variant="outlined"
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`report-${encodeURIComponent(data.id)}-content`}
        id={`report-${encodeURIComponent(data.id)}-header`}
      >
        {data.errors.length || data.rejectedTransactions.length ? (
          <ReportIcon color="error" />
        ) : data.importedTransactions || data.updatedTransactions ? (
          <DoneIcon color="success" />
        ) : (
          <HideSourceIcon color="disabled" />
        )}

        <Typography component="span" sx={{ paddingLeft: 2 }}>
          {data.time.toLocaleString()}
        </Typography>
      </AccordionSummary>

      <AccordionActions>
        <Button
          sx={{ alignSelf: 'center', marginTop: 2 }}
          onClick={() => {
            previewSchedule({ navigate, scheduleID: data.scheduleID });
          }}
          startIcon={<VisibilityIcon />}
        >
          {data.scheduleName || data.scheduleID}
        </Button>
      </AccordionActions>

      <AccordionDetails>
        <Stack spacing={2}>
          {data.errors.map((error, index) => (
            <Alert key={index} severity="error">
              {stringifyError(error)}
            </Alert>
          ))}

          {data.rejectedTransactions.map(
            ({ sourceID, sourceAccountID, reason, details }, index) => (
              <Alert key={index} severity="error">
                A transaction from source "{sourceID}", account "
                {sourceAccountID}" could not be imported ({reason}):
                <pre>{JSON.stringify(details)}</pre>
              </Alert>
            ),
          )}

          {data.importedTransactions || data.updatedTransactions ? (
            <Alert severity="success">
              {!data.importedTransactions
                ? null
                : `${data.importedTransactions.toLocaleString()} new transactions were successfully imported.`}
              {!data.updatedTransactions
                ? null
                : `${data.updatedTransactions.toLocaleString()} transactions were updated.`}
            </Alert>
          ) : (
            <Alert severity="info">No new transactions were imported.</Alert>
          )}

          {!data.resolvedTransactions.length ? null : (
            <List
              aria-labelledby="resolved-transactions-header"
              subheader={
                <ListSubheader
                  component="div"
                  id="resolved-transactions-header"
                >
                  Processed transactions
                </ListSubheader>
              }
            >
              {data.resolvedTransactions.map(
                (
                  {
                    sourceID,
                    sourceAccountID,
                    targetID,
                    targetAccountID,
                    details,
                  },
                  index,
                ) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Source "${sourceID}", account "${sourceAccountID}" to target "${targetID}", account "${targetAccountID}"`}
                      secondary={JSON.stringify(details)}
                    />
                  </ListItem>
                ),
              )}
            </List>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
