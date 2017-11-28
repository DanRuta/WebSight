WebSight
===

Browser based real time VR video pass-through augmentation via WebGL shaders such as edge detection, to aid the visually impaired.

Live PWA demo: https://websight.danruta.co.uk/

---

Today, about 4% of the world’s population are visually impaired. Navigation and pathfinding are issues they have to deal with every day and are problems for which many imperfect, unintuitive solutions exist.

For many years, operating systems, applications and websites have provided assistive functionality through overlay filters such as high contrast mode, and inverted colours.

What if we took that concept and applied it to their lives outside of web surfing?

WebSight is a small experiment that uses highly configurable WebGL shaders in phone based VR video feeds, to help give visually impaired people a new perspective on life.

---


#### To develop
```npm install``` the dependencies and run grunt to minify the code as you go.

#### To run
There is a demo ```index.html``` file included. You must serve this via the included ```server.js``` file which you can start with node.js.