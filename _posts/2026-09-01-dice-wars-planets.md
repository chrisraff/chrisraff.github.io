---
title: "Announcing Dice Wars: Planets"
date: 2026-09-01
tags: [dicewars, dicewars-planets]
img: "/images/dicewars-planets-thumbnail.png"
---

Dicewars like never before: on a sphere.

### [Click to play Dicewars Planets!](/dicewars-planets)

<figure class="post-figure-right post-figure-wide">
<img src="/images/postmedia/dicewars-4p-1234-12.gif" alt="Four AI players battling over hexagonal territories on a slowly rotating planet">
</figure>

Dicewars - the game of conquering territory by rolling dice - remains a longstanding fascination of mine: I've [given it smarter opponents before](/dicewarsai), and I first created Dicewars planets 11 years ago in 2015. At least, I think so - it was never released and the code is lost to time. The idea has been bouncing around my head all these years, and I've finally brought it back to life.

Dicewars on a sphere poses new and interesting terrain configurations. Now territories can wrap the equator, and there can be land bridges across the poles creating interesting attacks from all angles. While interesting, it also poses a whole lot of usability issues: it's hard to keep your head on straight when you're constantly panning around the map, and this was a major pitfall of the 2015 attempt. This time I've put a substantial amount of work into minimizing camera panning by grouping one player's nearby attacks (without affecting strategy), and allowing you to seamlessly take and relieve control of the camera.

## New Dicewars Opponents
This also was a great opportunity to rework the strength of the computer players. In 2015 I had to dream up and write new algorithms for the players. Nowadays, I can work with Large Language Models - in a fascinating chain of AI coaching AI - to produce some truly menacing AI players.

By giving the LLM specific strategic ideas, it could craft algorithms to identify those heuristics. Then it was trivial to run through and analyze thousands of matches in the virtual arena so that the new heuristics could be weighted against existing ones, and tuned to produce verified winners.

Note that despite the widespread commercialization of "AI" to mean LLMs, and LLM involvement in their development, the AI in this game remain AI in the true sense - they are just algorithms that choose attacks.

Check out the new "Hard" and "Expert" modes. These are AI that make you work for a win - they park dice strategically and they don't stretch themselves too thin. They know the odds of attacks and they aren't afraid to take a risk when it makes sense.

## Quality of Life

<figure class="post-figure-right">
<img src="/images/postmedia/dicewars-planets-battle-log.png" alt="The expandable battle history panel, listing each attack with the individual dice that were rolled" loading="lazy">
</figure>

There's a handful of other quality of life improvements I've always wanted:

- **Battle log.** Did you miss that really unlikely roll that the AI did a few turns back? Now there's an expandable history of what rolls happened, down to the individual dice involved.
- **Saved games.** Had to step away from a long game and the browser closed? Your game is saved and waiting for you.
- **Replays.** You can now scrub through replays instead of sitting through the whole thing. There's also a graph view to show you the history in a nutshell.
- **An explainer.** A little section at the bottom of the menu which explains some fundamental concepts that the original game never did.
- **The panic click.** Accidentally misclicked and now you're attacking the wrong territory? Throw a panic click anywhere - you have a small window of time where you can cancel the attack. The window closes before you can get any information from the animated dice.

## Feedback

I hope you'll enjoy throwing dice and vanquishing enemies on a strange new world. As always, feel free to get in touch on [linkedin](https://www.linkedin.com/in/chris-raff/) or by [opening a github issue](https://github.com/chrisraff/dicewars-planets/issues) if you have any feedback on the new game!

