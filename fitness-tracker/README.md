# Limitless Fitracker

A mobile-first, dark-mode personal fitness tracker named **Limitless Fitracker**. No paid builder, API, account, or server database required.

## Features
- Food diary with calories, protein, carbohydrates, fat and fibre calculated from user-entered per-100g/ml nutrition values
- Steps, distance and walking/activity duration
- Workout log with sets, reps, load and duration
- Water and sleep logging
- Weight and waist measurements with a simple weight trend chart
- Configurable daily targets and rule-based observations
- JSON backup/restore and food CSV export
- Browser-local storage and basic offline caching

## Privacy and limitations
All tracker entries are stored in the browser's local storage on the current device. They are not uploaded to GitHub. Clearing website data can erase entries; export JSON backups regularly. This first version does not sync between devices, read Apple Health/Samsung Health, or provide automatic step counting. Food nutrition data must be entered from a label or trusted reference. Insights are simple rules, not medical advice.

## GitHub Pages
In the repository settings, enable Pages and select **Deploy from a branch**, branch **main**, folder **/ (root)** only if publishing repository root. Since this app is in `/fitness-tracker`, use the repository's Pages root deployment and open `/fitness-tracker/` on the published site. Alternatively configure a GitHub Actions Pages workflow to publish the repository contents.
