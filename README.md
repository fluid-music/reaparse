# ReaParse

`reaparse` is the first step toward converting a `.RPP` session into a [fluid-music](https://github.com/fluid-music/fluid-music) `FluidSession` instance.

The main Fluid Music library can already convert from `FluidSession` to a `.RPP` file. This is a first step toward going the other direction.

This is a lossy conversion!

The Fluid Music session format is designed to describe only the 6 core components that are central DAWs and present in effectively all DAWs: tracks, clips (audio and midi), routing, automation, plugins, and sessions. As a result only these core components will be captured in the conversion process.

This repo is experimental. I will use it to evaluate the feasibility of adding `.RPP` import into the main `fluid-music` package.
