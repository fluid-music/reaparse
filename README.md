# ReaParse

`reaparse` is the first step toward converting a `.RPP` session into a [fluid-music](https://github.com/fluid-music/fluid-music) `FluidSession` instance.

The main Fluid Music library can correctly convert from `FluidSession` to a `.RPP` file. This repo is a step toward going the other direction.

**NOTE!** Conversion from `.RPP` to fluid music is lossy!

The Fluid Music session format is designed to describe only the 6 core components that are central DAWs and present in effectively all DAWs: tracks, clips (audio and midi), routing, automation, plugins, and sessions. As a result only these core components will be captured in the conversion process. Read my [PhD Dissertation](https://web.media.mit.edu/~holbrow/project/fluid-music/Fluid-Music-Charles-Holbrow-PhD-Dissertation.pdf) for more details.

This repo is experimental. I will use it to evaluate the feasibility of adding `.RPP` import into the main `fluid-music` package.

## Setup Test Driven Development

```sh
git clone git@github.com:fluid-music/reaparse.git
cd reaparse
# watch and continuously compile typescript (both tests and src)
npm run watch-ts
# In a new terminal tab, watch and rerun the compiled tests
npm run watch-tests
```
