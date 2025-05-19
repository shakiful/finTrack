'use server';

/**
 * @fileOverview An AI agent for identifying potential savings opportunities based on user spending patterns.
 *
 * - identifyPotentialSavings - A function that analyzes spending and suggests savings.
 * - IdentifyPotentialSavingsInput - The input type for the identifyPotentialSavings function.
 * - IdentifyPotentialSavingsOutput - The return type for the identifyPotentialSavings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPotentialSavingsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A detailed list of the user spending habits, with amount, date, and category for each transaction.'
    ),
  financialGoals: z
    .string()
    .optional()
    .describe('The users stated financial goals.'),
});
export type IdentifyPotentialSavingsInput = z.infer<typeof IdentifyPotentialSavingsInputSchema>;

const IdentifyPotentialSavingsOutputSchema = z.object({
  savingsOpportunities: z
    .string()
    .describe(
      'A detailed list of potential savings opportunities, including specific areas where the user can reduce spending and save money.  Include the category of the expense and the amount that could be saved.'
    ),
  totalPotentialSavings: z
    .string()
    .describe('The total amount that the user could potentially save.'),
});
export type IdentifyPotentialSavingsOutput = z.infer<typeof IdentifyPotentialSavingsOutputSchema>;

export async function identifyPotentialSavings(
  input: IdentifyPotentialSavingsInput
): Promise<IdentifyPotentialSavingsOutput> {
  return identifyPotentialSavingsFlow(input);
}

const identifyPotentialSavingsPrompt = ai.definePrompt({
  name: 'identifyPotentialSavingsPrompt',
  input: {schema: IdentifyPotentialSavingsInputSchema},
  output: {schema: IdentifyPotentialSavingsOutputSchema},
  prompt: `You are a personal finance expert. Analyze the user's spending data and identify potential savings opportunities.

Spending Data: {{{spendingData}}}
Financial Goals: {{{financialGoals}}}

Identify areas where the user can reduce spending and save money. Provide specific suggestions and estimate the potential savings.

Format your response as a list of savings opportunities, each including the category of the expense and the amount that could be saved. Also, calculate the total potential savings.
`,
});

const identifyPotentialSavingsFlow = ai.defineFlow(
  {
    name: 'identifyPotentialSavingsFlow',
    inputSchema: IdentifyPotentialSavingsInputSchema,
    outputSchema: IdentifyPotentialSavingsOutputSchema,
  },
  async input => {
    const {output} = await identifyPotentialSavingsPrompt(input);
    return output!;
  }
);
