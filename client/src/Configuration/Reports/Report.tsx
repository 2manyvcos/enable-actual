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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router';
import { type output } from 'zod';
import { gotoReports, previewReport } from '@/actions/reports';
import { previewSchedule } from '@/actions/schedules';
import type ImportReport from '@shared/schema/ImportReport';
import TransactionHeader from './TransactionHeader';
import TransactionRow from './TransactionRow';

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
          {data.errors.map(
            (
              { message, sourceID, sourceAccountID, targetID, targetAccountID },
              index,
            ) => (
              <Alert key={index} severity="error">
                {message || 'Unexpected error'}

                {!sourceID ? null : (
                  <Typography
                    variant="body2"
                    title={[sourceID, sourceAccountID]
                      .filter(Boolean)
                      .join(' - ')}
                  >
                    Source: {data.sources[sourceID]?.name || sourceID}{' '}
                    {!sourceAccountID ? null : (
                      <>
                        - Account:{' '}
                        {data.sources[sourceID]?.accounts[sourceAccountID]
                          ?.name || sourceAccountID}
                      </>
                    )}
                  </Typography>
                )}

                {!targetID ? null : (
                  <Typography
                    variant="body2"
                    title={[targetID, targetAccountID]
                      .filter(Boolean)
                      .join(' - ')}
                  >
                    Target: {data.targets[targetID]?.name || targetID}{' '}
                    {!targetAccountID ? null : (
                      <>
                        - Account:{' '}
                        {data.targets[targetID]?.accounts[targetAccountID]
                          ?.name || targetAccountID}
                      </>
                    )}
                  </Typography>
                )}
              </Alert>
            ),
          )}

          {!data.rejectedTransactions.length ? null : (
            <Alert severity="error">
              {data.rejectedTransactions.length.toLocaleString()} transactions
              could not be imported. See "Details" for more information.
            </Alert>
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

          <Accordion
            variant="outlined"
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="report-details-content"
              id="report-details-header"
            >
              <Typography component="span">Details</Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={2}>
                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                  <Table
                    stickyHeader
                    size="small"
                    aria-labelledby="rejected-transactions-title"
                  >
                    <TableHead>
                      <TransactionHeader
                        title="Rejected Transactions"
                        rejected
                      />
                    </TableHead>

                    <TableBody>
                      {data.rejectedTransactions.map(
                        (
                          { sourceID, sourceAccountID, reason, details },
                          index,
                        ) => (
                          <TransactionRow
                            key={index}
                            sourceID={sourceID}
                            sourceAccountID={sourceAccountID}
                            rejectionReason={reason}
                            details={details}
                            report={data}
                          />
                        ),
                      )}

                      {data.rejectedTransactions.length ? null : (
                        <TableRow
                          sx={{
                            '& > *': { borderBottom: 'unset' },
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell colSpan={7}>
                            <i>No entries</i>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                  <Table
                    stickyHeader
                    size="small"
                    aria-labelledby="processed-transactions-title"
                  >
                    <TableHead>
                      <TransactionHeader title="Processed Transactions" />
                    </TableHead>

                    <TableBody>
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
                          <TransactionRow
                            key={index}
                            sourceID={sourceID}
                            sourceAccountID={sourceAccountID}
                            targetID={targetID}
                            targetAccountID={targetAccountID}
                            details={details}
                            report={data}
                          />
                        ),
                      )}

                      {data.resolvedTransactions.length ? null : (
                        <TableRow
                          sx={{
                            '& > *': { borderBottom: 'unset' },
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell colSpan={7}>
                            <i>No entries</i>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
