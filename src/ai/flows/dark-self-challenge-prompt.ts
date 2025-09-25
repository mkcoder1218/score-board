'use server';

/**
 * @fileOverview Generates a motivational message when the user fails the Dark Self Challenge.
 *
 * - generateDarkSelfMessage - A function that generates a motivational message.
 * - DarkSelfChallengeInput - The input type for the generateDarkSelfMessage function.
 * - DarkSelfChallengeOutput - The return type for the generateDarkSelfMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DarkSelfChallengeInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  timeLimit: z.number().describe('The time limit in seconds.'),
});
export type DarkSelfChallengeInput = z.infer<typeof DarkSelfChallengeInputSchema>;

const DarkSelfChallengeOutputSchema = z.object({
  message: z.string().describe('A motivational message for the player.'),
});
export type DarkSelfChallengeOutput = z.infer<typeof DarkSelfChallengeOutputSchema>;

export async function generateDarkSelfMessage(input: DarkSelfChallengeInput): Promise<DarkSelfChallengeOutput> {
  return darkSelfChallengeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'darkSelfChallengePrompt',
  input: {schema: DarkSelfChallengeInputSchema},
  output: {schema: DarkSelfChallengeOutputSchema},
  prompt: `You are a motivational coach. The player {{playerName}} has failed to click the button within the time limit of {{timeLimit}} seconds in the Dark Self Challenge.

Generate a short motivational message (under 30 words) to encourage them to improve their consistency and discipline. Focus on actionable steps they can take. Be empathetic, but firm. Do not include an introduction. Do not include their name in the message.`,
});

const darkSelfChallengeFlow = ai.defineFlow(
  {
    name: 'darkSelfChallengeFlow',
    inputSchema: DarkSelfChallengeInputSchema,
    outputSchema: DarkSelfChallengeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
