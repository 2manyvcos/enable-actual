import AddIcon from '@mui/icons-material/Add';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { output } from 'zod';
import ActualBudgetAddTarget from '@/integrations/actualbudget/AddTarget';
import type TargetRequest from '@shared/schema/TargetRequest';

const components = {
  actualbudget: ActualBudgetAddTarget,
};

export default function AddTarget() {
  const [expanded, setExpanded] = useState(false);
  const [type, setType] =
    useState<output<typeof TargetRequest>['type']>('actualbudget');

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
        aria-controls="add-target-content"
        id="add-target-header"
      >
        <Typography component="span">Add target</Typography>
      </AccordionSummary>

      <Component
        onReset={() => {
          setExpanded(false);
          setType('actualbudget');
        }}
      />
    </Accordion>
  );
}
