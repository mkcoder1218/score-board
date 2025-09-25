# **App Name**: Consistent Clicker

## Core Features:

- Player Setup: Allow users to enter and save multiple player names using localStorage. Retain names until manually reset, as requested.
- Score Counter Mode: Implement a mode with manual score increment and optional timer with localStorage persistence, determining the winner by highest score.
- First-Click Wins Mode: Create a game mode where the first player to click wins, with game details recorded in localStorage.
- Dark Self Challenge Mode: Based on First-Click Wins. Motivate you to act on time, the LLM acts as a tool. Win if clicked before the time ends.
- Data Persistence: Saves scores, names, game modes, and winner info into local storage
- Game History: Show previous game data and outcome; saved in local storage.
- Clear History: Implements a 'Clear History' feature in the history to clear localStorage. Only be available in Game History Page.

## Style Guidelines:

- Primary color: HSL suggests a lively light-blue, and because acting 'on time' evokes clarity, go with light-blue (#64B5F6). This primary color can be successfully combined with the suggested light color scheme.
- Background color: A light tint of blue (#E3F2FD), provides a subtle backdrop that keeps focus on the game.
- Accent color: A more saturated, brighter tint of green (#9CCC65), an analogous hue to the primary blue. Can also highlight your successes.
- Headline font: 'Space Grotesk' (sans-serif) to emphasize a modern UI design. Good to use to highlight the game and the 'First Click' style.
- Body font: 'Inter' (sans-serif), designed for readability on screens, complementing the 'Space Grotesk' headlines. Suitable for all text, and great for multiple use cases.
- Use simple, flat icons to represent player actions and game modes. For the Dark Self challenges, consider an icon of a clock or shadow.
- Add subtle animations to indicate when a player scores, wins, or when time runs out in the Dark Self challenge.