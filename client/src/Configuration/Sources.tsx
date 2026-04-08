import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';

export default function Sources() {
  // TODO:
  const accounts = [
    {
      id: 'test',
      name: 'Test',
      type: 'enablebanking',
    },
  ];

  return (
    <Stack spacing={2}>
      <List>
        {accounts.map((account) => (
          <ListItem
            key={account.id}
            secondaryAction={
              <IconButton aria-label="delete">
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={account.name} secondary={account.type} />

            <Button sx={{ marginInline: 2 }}>Authorize</Button>
          </ListItem>
        ))}
      </List>

      <Button startIcon={<AddIcon />}>Add account</Button>
    </Stack>
  );
}
