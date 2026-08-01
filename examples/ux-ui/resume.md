---
title: ux-ui
template: resume
lang: en
icons: 
  - material:
    - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
date:
  - year: YYYY
custom:
  field:
    - title
    - subtitle
    - summary
    - org
page:
  size: A4
  margin: 0
regions:
  header:
    enabled: true
    sections:
      - header-content
  main:
    enabled: true
    sections:
      - who-am-i
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

@hidden ## Header {.header-content}

:::block{.profile}
@title Mila Hart
@subtitle Product & UX Designer
@note Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam velit.
:::

:::block{.contact}
- @icon:material phone_enabled | +00 000 000 0000
- @icon:material mail | [hello@example.com](mailto:hello@example.com)
- @icon:material public | www.example.com
- @icon:material location_on | 88 Harbor Ave, Portland, OR 97204, USA
:::

## Who Am I {.who-am-i}

:::block{.summary}
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam velit, esse pariatur in minima nostrum harum dolorum perferendis quasi dolor autem deleniti inventore.
:::

:::block{.skill-set}
- @pair Ps | ●●●●○
- @pair Ai | ●●●●○
- @pair ƒ | ●●●●○
- @pair 5 | ●●●●○
:::

## Expert In {.expert-in}

:::block
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus sunt veritatis totam.
:::

:::block{.meter-list}
- @pair Graphic Design | 60
- @pair CSS | 90
- @pair JavaScript | 70
- @pair WordPress | 80
:::

## Education {.education}

:::block{.education}
@date:year 11/11/2020 - @date:year 07/07/2022
@org Webmart
@title UI/UX
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{.education}
@date:year 11/11/2018 - @date:year 07/07/2020
@org Iegbook
@title Web Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{.education}
@date:year 19/10/2015 - @date:year 03/05/2018
@org Myzone
@title Graphic Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

## Experience {.experience}

:::block{.job}
@date:year 11/11/2020 - @date:year 07/07/2022
@org Webmart
@title UI/UX
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{.job}
@date:year 11/11/2018 - @date:year 07/07/2020
@org Iegbook
@title Web Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

:::block{.job}
@date:year 19/10/2015 - @date:year 03/05/2018
@org Myzone
@title Graphic Designer
@summary Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non vel, sint nisi possimus.
:::

## What I Do {.what-i-do}

:::block{.service}
@icon:material screenshot_monitor
@pair UX & UI | Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{.service}
@icon:material border_style
@pair Visual Design | Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{.service}
@icon:material mobile_2
@pair App Design | Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

:::block{.service}
@icon:material print
@pair Print Design | Lorem ipsum dolor sit amet, consectetur adipisicing elit.
:::

@hidden ## Interests {.interests}

:::block{.interests}
- @icon:material photo_camera | Photography
- @icon:material music_note_2 | Music
- @icon:material sports_soccer | Football
- @icon:material directions_bike | Cycling
- @icon:material book_4 | Reading
:::
