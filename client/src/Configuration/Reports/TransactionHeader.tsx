import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

export default function TransactionHeader({
  title,
  rejected,
}: {
  title: ReactNode;
  rejected?: boolean;
}) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={!rejected ? 6 : 7}>{title}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell />

        {!rejected ? null : <TableCell />}

        <TableCell>Date</TableCell>

        <TableCell>Payee</TableCell>

        <TableCell>Notes</TableCell>

        <TableCell align="right">Amount</TableCell>

        <TableCell>Currency</TableCell>
      </TableRow>
    </>
  );
}
