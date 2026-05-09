import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowStepper } from './WorkflowStepper';

const steps = [
  { id: 'a', title: 'Load', description: '상품 조회', content: <div>step-a-body</div> },
  { id: 'b', title: 'Buy', description: '구매', content: <div>step-b-body</div> },
  { id: 'c', title: 'Done', content: <div>step-c-body</div> },
];

describe('WorkflowStepper', () => {
  it('renders every step title and only the active step body', () => {
    render(<WorkflowStepper steps={steps} activeStep={0} onStepClick={() => {}} />);

    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    expect(screen.getByText('step-a-body')).toBeInTheDocument();
    expect(screen.queryByText('step-b-body')).not.toBeInTheDocument();
  });

  it('invokes onStepClick with the clicked step index', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<WorkflowStepper steps={steps} activeStep={0} onStepClick={onStepClick} />);

    await user.click(screen.getByRole('button', { name: /Buy/ }));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });
});
