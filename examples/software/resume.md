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

## Alex Morgan {.name}

:::block{role=title}
@subtitle Senior Data Scientist
:::

@hidden ## Profile picture {.profile-picture}

:::block{role=profile-image}
@image profile
:::

## Contact {.contact}

:::block{role=contact}
- @icon:fa location-dot | Zurich, Switzerland
- @icon:fa envelope | [hello@example.com](mailto:hello@example.com)
- @icon:fa phone | +00 000 000 0000
- @icon:fa github | [github.com/example](https://github.com/example)
- @icon:fa linkedin | [linkedin.com/in/example](https://linkedin.com/in/example)
:::

## Summary {.summary}

:::block{role=summary}
@summary Senior data scientist with **6+ years of experience** delivering machine learning solutions for forecasting, anomaly detection, and decision support in production environments.
@summary Strong background in statistical modeling, feature engineering, experiment design, and model lifecycle management, with consistent focus on measurable business impact.
@note Open to senior data science roles spanning applied ML, product analytics, and ML platform collaboration.
:::

## Experience {.experience}

:::block{kind=job role=experience}
### Senior Data Scientist — Climate Intelligence Platform
@date Nov 2024 – Present
@org Climate Intelligence Platform
@meta Zurich, Switzerland
@stack Python, Pandas, XGBoost, PyTorch, MLflow, PostgreSQL, Docker
- Built probabilistic forecasting models for weather and telemetry signals, improving alert precision and planning reliability.
- Designed feature pipelines for high-volume time-series data and standardized offline/online feature parity checks.
- Led model evaluation framework design, including drift monitoring and threshold tuning across multiple product domains.
- Partnered with product teams to translate model outputs into actionable operational dashboards.
:::

:::block{kind=job role=experience}
### Data Scientist — Mission-Critical Systems Company
@date:article 01/11/2023 – Nov 2024
@org Mission-Critical Systems Company
@meta Southern France
@stack Python, Scikit-learn, TensorFlow, SQL, Airflow, Docker
- Developed anomaly detection and ranking models to prioritize critical events in mission support workflows.
- Implemented reproducible training pipelines with model versioning and automated validation checks.
- Collaborated with domain experts to refine labeling strategies and improve signal quality for supervised learning tasks.
:::

:::block{kind=job role=experience}
### Data Scientist — Industrial Analytics Group
@date Mar 2020 – Aug 2022
@org Industrial Analytics Group
@meta France
@stack Python, NumPy, Scikit-learn, Elasticsearch
- Built predictive maintenance models using equipment logs and sensor features, reducing unplanned downtime.
- Designed KPI frameworks and cohort analyses to support product and operations decision-making.
- Improved search and diagnostic workflows by combining statistical scoring with domain-specific heuristics.
:::

## Projects {.projects}

:::block{kind=project role=projects}
### ForecastLab
@links GitHub: [github.com/example/forecastlab-template](https://github.com/example/forecastlab-template)
@stack Python, LightGBM, FastAPI, DVC, Streamlit
@summary Built an end-to-end forecasting toolkit with training pipelines, model registry, and interactive evaluation dashboard.
- Implemented backtesting utilities, confidence interval calibration, and feature attribution reporting.
- Added automated data quality checks and experiment tracking for reproducible model development.
- Exposed model inference through a lightweight API and analyst-facing dashboard for scenario testing.
:::

## Education {.education}

:::block{kind=education role=education}
### M.Sc. in Data Science — European Institute of Technology
@date:year 01/08/2018 – 2021
@org European Institute of Technology
@meta Europe
@summary Focus on machine learning, applied statistics, optimization, and large-scale data systems.
:::

## Skills {.skills}

:::block{role=skills-group}
@title Core Languages
- Python
- SQL
- R
- Bash
:::

:::block{role=skills-group}
@title Machine Learning
- Scikit-learn
- XGBoost
- LightGBM
- PyTorch
- TensorFlow
:::

:::block{role=skills-group}
@title Statistics & Experimentation
- Hypothesis Testing
- A/B Testing
- Time-Series Modeling
- Bayesian Inference
- Causal Analysis
:::

:::block{role=skills-group}
@title Data Engineering
- Feature Engineering
- Airflow
- dbt
- Data Validation
- ETL/ELT Pipelines
:::

:::block{role=skills-group}
@title MLOps
- MLflow
- DVC
- Model Monitoring
- Docker
- CI/CD for ML
:::

:::block{role=skills-group}
@title Analytics & Visualization
- Tableau
- Power BI
- Matplotlib
- Seaborn
- Plotly
:::

## Soft Skills {.soft-skills}

:::block{role=soft-skills}
- Structured analytical thinking
- Clear communication of technical insights
- Business-oriented prioritization
- Cross-functional collaboration
- Ownership from research to production
:::

## Languages {.languages}

:::block{role=languages}
- English — Fluent
- French — Professional working proficiency
- German — Basic
:::

## Interests {.interests}

:::block{role=interests}
- Applied AI research
- Trail running
- Data visualization design
- Open-source ML tooling
:::
