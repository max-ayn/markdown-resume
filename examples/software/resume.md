---
title: sftw
template: resume
lang: en
icons:
  - fa:
    - https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css
  - feather:
    - https://cdn.jsdelivr.net/npm/feather-icons@4.29.2/dist/feather.min.js
fonts:
  - Montserrat:
    - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap
images:
  profile: ./assets/profile.svg
date:
  - article: mm YYYY
  - year: YYYY
custom:
  field:
    - title
    - subtitle
    - summary
    - org
    - meta
    - links
page:
  size: A4
  margin: 0
regions:
  header:
    enabled: false
  sidebar:
    enabled: true
    sections:
      - profile-picture
      - contact
      - skills
      - soft-skills
      - interests
      - education
      - languages
  main:
    enabled: true
    sections:
      - name
      - summary
      - experience
      - projects
  footer:
    enabled: false
render:
  icons_enabled: true
  html_passthrough: false
  markdown_in_blocks: true
  allow_nested_blocks: true
class_prefix: resume
---

# Alex Morgan {.name}

@subtitle Senior Data Scientist

@hidden ## Profile picture {.profile-picture}

@image profile

## Contact {.contact}

- @icon:fa location-dot | Zurich, Switzerland
- @icon:fa envelope | [hello@example.com](mailto:hello@example.com)
- @icon:fa phone | +00 000 000 0000
- @icon:fa-brands github | [github.com/example](https://github.com/example)
- @icon:fa-brands linkedin | [linkedin.com/in/example](https://linkedin.com/in/example)

## Summary {.summary}

@summary Senior data scientist with **6+ years of experience** delivering machine learning solutions for forecasting, anomaly detection, and decision support in production environments.
@summary Strong background in statistical modeling, feature engineering, experiment design, and model lifecycle management, with consistent focus on measurable business impact.
@note Open to senior data science roles spanning applied ML, product analytics, and ML platform collaboration.

## Experience {.experience}

### Senior Data Scientist — Climate Intelligence Platform
@date Nov 2024 – Present
@org Climate Intelligence Platform
@meta Zurich, Switzerland
@stack Python, Pandas, XGBoost, PyTorch, MLflow, PostgreSQL, Docker
- Built probabilistic forecasting models for weather and telemetry signals, improving alert precision and planning reliability.
- Designed feature pipelines for high-volume time-series data and standardized offline/online feature parity checks.
- Led model evaluation framework design, including drift monitoring and threshold tuning across multiple product domains.
- Partnered with product teams to translate model outputs into actionable operational dashboards.

### Data Scientist — Mission-Critical Systems Company
@date:article 01/11/2023 – Nov 2024
@org Mission-Critical Systems Company
@meta Southern France
@stack Python, Scikit-learn, TensorFlow, SQL, Airflow, Docker
- Developed anomaly detection and ranking models to prioritize critical events in mission support workflows.
- Implemented reproducible training pipelines with model versioning and automated validation checks.
- Collaborated with domain experts to refine labeling strategies and improve signal quality for supervised learning tasks.

### Data Scientist — Industrial Analytics Group
@date Mar 2020 – Aug 2022
@org Industrial Analytics Group
@meta France
@stack Python, NumPy, Scikit-learn, Elasticsearch
- Built predictive maintenance models using equipment logs and sensor features, reducing unplanned downtime.
- Designed KPI frameworks and cohort analyses to support product and operations decision-making.
- Improved search and diagnostic workflows by combining statistical scoring with domain-specific heuristics.

## Projects {.projects}

### ForecastLab
@links GitHub: [github.com/example/forecastlab-template](https://github.com/example/forecastlab-template)
@stack Python, LightGBM, FastAPI, DVC, Streamlit
@summary Built an end-to-end forecasting toolkit with training pipelines, model registry, and interactive evaluation dashboard.
- Implemented backtesting utilities, confidence interval calibration, and feature attribution reporting.
- Added automated data quality checks and experiment tracking for reproducible model development.
- Exposed model inference through a lightweight API and analyst-facing dashboard for scenario testing.

## Education {.education}

### M.Sc. in Data Science — European Institute of Technology
@date:year 01/08/2018 – 2021
@org European Institute of Technology
@meta Europe
@summary Focus on machine learning, applied statistics, optimization, and large-scale data systems.

## Skills {.skills}

:::block
@title Core Languages
- Python
- SQL
- R
- Bash
:::

:::block
@title Machine Learning
- Scikit-learn
- XGBoost
- LightGBM
- PyTorch
- TensorFlow
:::

:::block
@title Statistics & Experimentation
- Hypothesis Testing
- A/B Testing
- Time-Series Modeling
- Bayesian Inference
- Causal Analysis
:::

:::block
@title Data Engineering
- Feature Engineering
- Airflow
- dbt
- Data Validation
- ETL/ELT Pipelines
:::

:::block
@title MLOps
- MLflow
- DVC
- Model Monitoring
- Docker
- CI/CD for ML
:::

:::block
@title Analytics & Visualization
- Tableau
- Power BI
- Matplotlib
- Seaborn
- Plotly
:::

## Soft Skills {.soft-skills}

:::block
- Structured analytical thinking
- Clear communication of technical insights
- Business-oriented prioritization
- Cross-functional collaboration
- Ownership from research to production
:::

## Languages {.languages}

:::block
- English — Fluent
- French — Professional working proficiency
- German — Basic
:::

## Interests {.interests}

:::block
- Applied AI research
- Trail running
- Data visualization design
- Open-source ML tooling
:::

<style>
:root {
  --page-bg: #dbe5ec;
  --paper: #fcfeff;
  --sidebar-bg: #d8e6ee;
  --sidebar-line: #b7cdda;
  --ink: #1f2b34;
  --muted: #506572;
  --soft: #6f8390;
  --line: #c6d8e3;
  --accent: #1c425b;
  --icon: #2b5f7d;
}

body {
  background: var(--page-bg);
  color: var(--ink);
  font-family: "Montserrat", "Avenir Next", "Segoe UI", Arial, sans-serif;
  font-size: 2.72mm;
  line-height: 1.42;
}

a {
  color: inherit;
  text-decoration: none;
}

.page {
  margin: 4.5mm auto;
  background: var(--paper);
}

.resume {
  display: grid;
  grid-template-columns: 35% 65%;
  grid-template-areas: "sidebar main";

  > .resume-region {
    &[data-region="sidebar"] {
      grid-area: sidebar;
      background: var(--sidebar-bg);
      border-right: 0.26mm solid var(--sidebar-line);
      padding: 11mm 7mm 9mm;
      height: 29.7cm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    &[data-region="main"] {
      grid-area: main;
      background: var(--paper);
      padding: 13mm 9mm 9.5mm;
      height: 29.7cm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    &[data-region="footer"],
    &[data-region="header"] {
      display: none;
    }
  }
}

/*
 * Sections have no wrapping element - a section is just an `<h2 class="id">`
 * followed by sibling `.resume-block`s until the next `<h2>`. Section-title
 * styling therefore targets the heading directly; section-scoped content
 * styling targets `.resume-block--<role>`/`.resume-block--<kind>` (from
 * `:::block{role=... kind=...}`), which plays the role the old
 * `[data-section="..."]` wrapper used to.
 */
.resume-region > h2 {
  margin: 3.1mm 0 2.15mm;

  &:first-child {
    margin-top: 0;
  }
}

.resume-block {
  &:last-child {
    margin-bottom: 0;
  }

  /* `###` block-title shorthand renders as a plain, unclassed `<h3>`. */
  h3 {
    margin: 0 0 0.5mm;
    color: var(--accent);
    font-size: 2.95mm;
    font-weight: 700;
    line-height: 1.3;
  }

  /* Plain markdown bullet lists (highlights) - excludes the `@stack` list,
     which carries its own `.resume-block__stack` class. */
  > ul:not(.resume-block__stack) {
    margin: 0.75mm 0 0;

    > li {
      margin: 0 0 0.5mm;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.resume-field {
  margin: 0 0 0.55mm;
}

.resume-field--summary,
.resume-field--meta {
  color: var(--muted);
}

.date {
  color: var(--muted);
}

/* `@note` renders as a plain `<blockquote><p>...</p></blockquote>`, sitting
   directly inside a `.resume-section` now that section content is no longer
   forced into a `:::block` wrapper. */
.resume-section blockquote {
  position: relative;
  margin: 1mm 0 0;
  padding: 0.8mm 1.1mm 0.8mm 2mm;
  border-left: 0.45mm solid #8eb0c3;
  background: #edf4f8;
  font-style: italic;
  color: #4f6674;

  p {
    margin: 0;
  }

  &::before {
    content: "\201C";
    position: absolute;
    left: 0.55mm;
    top: 0.1mm;
    color: #7f9cae;
    font-size: 3.4mm;
    line-height: 1;
    font-style: normal;
  }
}

.resume-block__stack {
  list-style: none;
  margin: 0.6mm 0 0.95mm;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8mm;
}

.resume-block__stack-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0.32mm 1.05mm;
  border: 0.24mm solid #b9cfdb;
  border-radius: 999mm;
  font-size: 2.03mm;
  color: #406176;
  background: #eef5f9;
}

/* `@icon[:provider]` - the icon itself is an `<img>` (CDN provider) or an
   icon-font `<span data-icon>` (no provider); `.resume-block__item` is the
   wrapping `<span class="icon-line">`, not the `<li>`. */
.resume-block__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.2mm;
  min-width: 3.2mm;

  img {
    width: 2.6mm;
    height: 2.6mm;
    object-fit: contain;
  }
}

.resume-block__icon {
  color: var(--icon);
  font-size: 2.48mm;
  line-height: 1;
}

/* Sidebar */
.resume-region--sidebar h2 {
  margin-bottom: 1.2mm;
  color: var(--accent);
  font-size: 3.45mm;
  font-weight: 740;
  letter-spacing: 0;
  text-transform: none;
}

.resume-section--profile-picture {
  display: flex;
  justify-content: center;
}

.resume-block__image {
  margin: 0;
  width: 43mm;
  height: 43mm;
  border-radius: 50%;
  overflow: hidden;
  border: 1.1mm solid rgb(255 255 255 / 45%);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.resume-section--contact {
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
  }

  .resume-block__item {
    display: grid;
    grid-template-columns: 4mm 1fr;
    column-gap: 1.3mm;
    margin-bottom: 0.95mm;
    align-items: start;
    color: #3f5968;
  }
}

.resume-section--education,
.resume-section--skills,
.resume-section--soft-skills,
.resume-section--languages,
.resume-section--interests {
  margin-bottom: 2.35mm;
}

.resume-section--education {
  h3 {
    font-size: 2.55mm;
    margin-bottom: 0.25mm;
  }

  .resume-field--org,
  .resume-field--meta {
    display: inline;
    margin: 0;
    font-size: 2.22mm;
  }

  .resume-field--org {
    color: #294f66;
    font-weight: 640;
  }

  .resume-field--meta {
    color: #587383;

    &::before {
      content: " | ";
      color: #7e9aa9;
    }
  }

  .resume-field--summary {
    margin-top: 0.5mm;
  }

  .resume-field {
    font-size: 2.32mm;
    color: #3e5c6e;
  }
}

.resume-section--skills > .resume-block > ul > li,
.resume-section--soft-skills > .resume-block > ul > li,
.resume-section--languages > .resume-block > ul > li,
.resume-section--interests > .resume-block > ul > li {
  font-size: 2.32mm;
  color: #3e5c6e;
}

.resume-section--skills > .resume-block {
  /* Each `:::block` under Skills is one skills group (`@title` + pill list). */
  margin-bottom: 1.25mm;

  .resume-field--title {
    margin-bottom: 0.3mm;
    font-size: 2.32mm;
    color: #4a6a7d;
    font-weight: 680;
  }

  > ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.62mm;

    > li {
      margin: 0;
      padding: 0.24mm 0.88mm;
      border: 0.22mm solid #bdd2de;
      border-radius: 999mm;
      background: #edf4f8;
      color: #456377;
      font-size: 1.95mm;
      line-height: 1.12;
    }
  }
}

.resume-section--skills > .resume-block > ul,
.resume-section--soft-skills > .resume-block > ul,
.resume-section--languages > .resume-block > ul,
.resume-section--interests > .resume-block > ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Main hero: `# Alex Morgan {.name}` */
.resume-region--main {
  h1.name {
    margin: 0 0 4.4mm;
    font-size: 8.6mm;
    line-height: 0.94;
    letter-spacing: 0.04em;
    font-weight: 780;
    text-transform: uppercase;
  }

  /* Main sections */
  h2 {
    margin: 3.1mm 0 2.15mm;
    color: var(--accent);
    font-size: 3.35mm;
    font-weight: 730;

    &:not(.name) {
      border-bottom: 1.26mm solid var(--line);
      padding-bottom: 0.65mm;
    }
  }
}

.resume-section--name .resume-field--subtitle {
  margin-top: 0.85mm;
  font-size: 2.72mm;
  color: #4f6e80;
  font-weight: 620;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Experience / Projects timeline - each entry is a bare `### Title`
   auto-wrapped into a plain `.resume-block` directly under its section. */
.resume-section--experience,
.resume-section--projects {
  > .resume-block {
    position: relative;
    margin-bottom: 2.95mm;
    padding-left: 21mm;

    &:last-child {
      margin-bottom: 0;
    }

    &::before {
      content: "";
      position: absolute;
      left: 17.4mm;
      top: 0.7mm;
      bottom: 0.6mm;
      width: 0.35mm;
      background: #acc4d2;
    }

    &::after {
      content: "";
      position: absolute;
      left: 16.75mm;
      top: 0.5mm;
      width: 1.55mm;
      height: 1.55mm;
      border-radius: 50%;
      background: #7090a5;
    }

    /* `@date` renders inline inside an otherwise unclassed `<p>`; select
       that paragraph via :has() to reproduce the old timeline date column. */
    > p:has(.date) {
      position: absolute;
      left: 0;
      top: 0.25mm;
      width: 15.6mm;
      margin: 0;
      font-size: 2.12mm;
      line-height: 1.2;
      font-weight: 700;
      color: #648296;
      text-transform: uppercase;
    }

    h3 {
      margin: 0 0 0.25mm;
      font-size: 2.88mm;
      font-weight: 740;
    }

    .resume-field--org {
      margin: 0 0 0.18mm;
      font-size: 2.36mm;
      color: #2f556c;
      font-weight: 680;
    }

    .resume-field--meta {
      margin: 0 0 0.52mm;
      font-size: 2.12mm;
      color: #5f7c90;
    }

    .resume-block__stack {
      gap: 0.62mm;
      margin: 0.35mm 0 0.8mm;
    }

    .resume-block__stack-badge {
      padding: 0.24mm 0.88mm;
      border: 0.22mm solid #bdd2de;
      border-radius: 999mm;
      background: #f0f6fa;
      color: #4d6c80;
      font-size: 1.95mm;
      line-height: 1;
    }

    > ul:not(.resume-block__stack) {
      margin-top: 0.55mm;
      padding-left: 2.6mm;

      > li {
        margin-bottom: 0.38mm;
        color: #415d6f;
      }
    }
  }
}

.resume-section--summary {
  .resume-field--summary {
    color: #38596d;
    line-height: 1.5;
  }

  blockquote {
    margin-top: 1.2mm;
  }
}

strong {
  color: #1f435b;
  font-weight: 700;
}

code {
  font-family: "Menlo", "Consolas", monospace;
  font-size: 0.9em;
}

.is-hidden-source {
  outline: 0.26mm dashed #cc8b00;
  background: #fff3d6;
  opacity: 0.8;
}
</style>
