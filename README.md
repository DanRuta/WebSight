WebSight
===

Aiding the visually impaired through real time augmented reality via AI object detection and WebGL shaders effects such as edge detection, and colour adjustments.

To aid designers, the major colour blindness types can also be simulated through shader configurations.

Article: (soon)

Research paper link: https://dl.acm.org/citation.cfm?doid=3192714.3196319

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
You must serve this via the included ```server.js``` file which you can run with node.js.

# Citation

```
@inproceedings{Ruta:2018:WUA:3192714.3196319,
    author = {Ruta, Dan and Jordan, Louis and Fox, Tom James and Boakes, Rich},
    title = {WebSight: Using AR and WebGL Shaders to Assist the Visually Impaired},
    booktitle = {Proceedings of the Internet of Accessible Things},
    series = {W4A '18},
    year = {2018},
    isbn = {978-1-4503-5651-0},
    location = {Lyon, France},
    pages = {9:1--9:2},
    articleno = {9},
    numpages = {2},
    url = {http://doi.acm.org/10.1145/3192714.3196319},
    doi = {10.1145/3192714.3196319},
    acmid = {3196319},
    publisher = {ACM},
    address = {New York, NY, USA},
    keywords = {AR, Augmented Reality, PWA, VR, Virtual Reality, WebGL, accessibility, impaired, shaders, visually, web, websight},
}
```