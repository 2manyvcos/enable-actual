import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReportIcon from '@mui/icons-material/Report';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';
import type { output } from 'zod';
import type ImportReport from '@shared/schema/ImportReport';
import type Transaction from '@shared/schema/Transaction';

export default function TransactionRow({
  sourceID,
  sourceAccountID,
  targetID,
  targetAccountID,
  rejectionReason,
  details: { id, date, amount, currency, payee, notes, raw },
  report,
}: {
  sourceID?: string;
  sourceAccountID?: string;
  targetID?: string;
  targetAccountID?: string;
  rejectionReason?: string;
  details: Partial<output<typeof Transaction>>;
  report: output<typeof ImportReport>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
        }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        {rejectionReason === undefined ? null : (
          <TableCell title={rejectionReason || undefined}>
            <ReportIcon color="error" />
          </TableCell>
        )}

        <TableCell>{!date ? '-' : date.toDateString()}</TableCell>

        <TableCell>{payee || '-'}</TableCell>

        <TableCell>{notes || '-'}</TableCell>

        <TableCell align="right">
          {!amount ? '-' : (amount / 100).toLocaleString()}
        </TableCell>

        <TableCell>{currency || '-'}</TableCell>
      </TableRow>

      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { border: 0 },
        }}
      >
        <TableCell
          sx={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={rejectionReason === undefined ? 6 : 7}
        >
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="Transaction details">
                <TableBody>
                  {!rejectionReason ? null : (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Rejection Reason
                      </TableCell>

                      <TableCell>{rejectionReason}</TableCell>
                    </TableRow>
                  )}

                  {!sourceID ? null : (
                    <>
                      <TableRow title={sourceID}>
                        <TableCell component="th" scope="row">
                          Source
                        </TableCell>

                        <TableCell>
                          {report.sources[sourceID]?.name || sourceID}
                        </TableCell>
                      </TableRow>

                      {!sourceAccountID ? null : (
                        <TableRow title={sourceAccountID}>
                          <TableCell component="th" scope="row">
                            Source Account
                          </TableCell>

                          <TableCell>
                            {report.sources[sourceID]?.accounts[sourceAccountID]
                              ?.name || sourceAccountID}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}

                  {!targetID ? null : (
                    <>
                      <TableRow title={targetID}>
                        <TableCell component="th" scope="row">
                          Target
                        </TableCell>

                        <TableCell>
                          {report.targets[targetID]?.name || targetID}
                        </TableCell>
                      </TableRow>

                      {!targetAccountID ? null : (
                        <TableRow title={targetAccountID}>
                          <TableCell component="th" scope="row">
                            Target Account
                          </TableCell>

                          <TableCell>
                            {report.targets[targetID]?.accounts[targetAccountID]
                              ?.name || targetAccountID}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}

                  {!id ? null : (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Transaction ID
                      </TableCell>

                      <TableCell>{id}</TableCell>
                    </TableRow>
                  )}

                  {!raw ? null : (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Raw Dataset
                      </TableCell>

                      <TableCell>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{raw}</pre>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
