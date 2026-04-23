import AddIcon from '@mui/icons-material/Add';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { output } from 'zod';
import EnableBankingAddSource from '@/integrations/enablebanking/AddSource';
import type SourceRequest from '@shared/schema/SourceRequest';

const components = {
  enablebanking: EnableBankingAddSource,
};

export default function AddSource() {
  const [expanded, setExpanded] = useState(false);
  const [type, setType] =
    useState<output<typeof SourceRequest>['type']>('enablebanking');

  const Component = components[type];

  return (
    <Accordion
      variant="outlined"
      expanded={expanded}
      onChange={(_event, isExpanded) => {
        setExpanded(isExpanded);
      }}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary
        expandIcon={<AddIcon />}
        aria-controls="add-source-content"
        id="add-source-header"
      >
        <Typography component="span">Add source</Typography>
      </AccordionSummary>

      <Component
        onReset={() => {
          setExpanded(false);
          setType('enablebanking');
        }}
      />
    </Accordion>
  );
}
