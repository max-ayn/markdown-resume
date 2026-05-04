---
template: resume
lang: en
icons: 
    - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
page:
  size: A4
  margin: 0
regions:
  header:
    enabled: true
  main:
    enabled: true
    sections:
      - who-am-i-?
      - expert-in
      - education
      - experience
  sidebar:
    enabled: false
  footer:
    enabled: true
    sections:
      - what-i-do
      - interests
render:
  icons_enabled: true
  html_passthrough: false
  markdown_in_blocks: true
  allow_nested_blocks: true
class_prefix: resume
---

@hidden # Mila Hart

:::block{role=profile region=header}
@title Mila Hart
@subtitle Product & UX Designer
@note Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam velit.
:::

:::block{role=contact region=header}
- @icon phone_enabled | +00 000 000 0000
- @icon mail | hello@example.com
- @icon public | www.example.com
- @icon location_on | 88 Harbor Ave, Portland, OR 97204, USA
:::

## Who Am I

:::block{role=presentation}
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam velit, esse pariatur in minima nostrum harum dolorum perferendis quasi dolor autem deleniti inventore.
:::

:::block{role=icon-list}
- Ps | ●●●●○
- Ai | ●●●●○
- ƒ | ●●●●○
- 5 | ●●●●○
:::

## Expert In

:::block{role=skills-intro}
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam.
:::

:::block{role=meter-list}
- Graphic Design | 60
- CSS | 90
- JavaScript | 70
- WordPress | 80
:::

## Education

:::block{kind=education variant=timeline-card}
@date 2020 - 2022
@org Webmart
@title UI/UX
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{kind=education variant=timeline-card}
@date 2018 - 2020
@org Iegbook
@title Web Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{kind=education variant=timeline-card}
@date 2015 - 2018
@org Myzone
@title Graphic Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

## Experience

:::block{kind=job variant=timeline-card}
@date 2020 - 2022
@org Webmart
@title UI/UX
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{kind=job variant=timeline-card}
@date 2018 - 2020
@org Iegbook
@title Web Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{kind=job variant=timeline-card}
@date 2015 - 2018
@org Myzone
@title Graphic Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

## What I Do

:::block{kind=service variant=service-card}
@icon screenshot_monitor
@title UX & UI
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{kind=service variant=service-card}
@icon border_style
@title Visual Design
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{kind=service variant=service-card}
@icon mobile_2
@title App Design
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{kind=service variant=service-card}
@icon print
@title Print Design
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

@hidden ## Interests

:::block{role=interests region=footer}
- @icon photo_camera | Photography
- @icon music_note_2 | Music
- @icon sports_soccer | Football
- @icon directions_bike | Cycling
- @icon book_4 | Reading
:::
