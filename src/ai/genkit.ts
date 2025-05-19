
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Changed default model to a common and recent text model.
  // If 'gemini-1.5-flash-latest' is not available in your project/region,
  // you might need to use another valid model like 'gemini-1.0-pro'.
  model: 'googleai/gemini-2.0-flash',
});

