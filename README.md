# Football Impostor

A pass-the-phone party game for football fans, made just for fun at a friend's request (and on their idea).

**Play it here:** https://korejur.github.io/football-impostor/

## How to play

1. Choose how many people are playing (at least 3) and how many impostors there should be.
2. Pass one phone around. Each person taps **View Your Role**, looks, then taps **Next Player** and passes it on.
3. Everyone gets the same famous footballer, except the impostors, who get nothing.
4. Take turns describing the player without saying the name. Then vote on who you think the impostor is.
5. Impostors: blend in and try to guess the footballer before you're caught.

## Running it locally

It's a static site, so you only need a basic file server:

```bash
cp data.json public/data.json
npx serve public
```

The player list is in `data.json`, and `json_generator.py` was used to build it.

## Deployment

Each push to `main` deploys `public/` (plus `data.json`) to GitHub Pages through `.github/workflows/pages.yml`.

`server.js` is the original Express version and isn't used by the Pages build.
