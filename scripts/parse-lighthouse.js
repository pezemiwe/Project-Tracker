const fs = require('fs');

const reportPath = process.argv[2] || 'lighthouse-reports/login.json';
const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('=== LIGHTHOUSE SCORES ===\n');
console.log('Performance:', Math.round(data.categories.performance.score * 100));
console.log('Accessibility:', Math.round(data.categories.accessibility.score * 100));

if (data.categories['best-practices']) {
  console.log('Best Practices:', Math.round(data.categories['best-practices'].score * 100));
}

if (data.categories.seo) {
  console.log('SEO:', Math.round(data.categories.seo.score * 100));
}

console.log('\n=== KEY METRICS ===\n');

const metrics = {
  'First Contentful Paint': 'first-contentful-paint',
  'Largest Contentful Paint': 'largest-contentful-paint',
  'Total Blocking Time': 'total-blocking-time',
  'Cumulative Layout Shift': 'cumulative-layout-shift',
  'Speed Index': 'speed-index'
};

Object.entries(metrics).forEach(([name, key]) => {
  const audit = data.audits[key];
  if (audit) {
    console.log(`${name}: ${audit.displayValue}`);
  }
});

console.log('\n=== TOP OPPORTUNITIES (Potential Savings) ===\n');

const opportunities = Object.entries(data.audits)
  .filter(([_, v]) => v.details && v.details.type === 'opportunity' && v.numericValue > 0)
  .sort((a, b) => b[1].numericValue - a[1].numericValue)
  .slice(0, 5);

opportunities.forEach(([key, audit]) => {
  console.log(`- ${audit.title}`);
  console.log(`  Savings: ${audit.displayValue || audit.numericValue}`);
});

console.log('\n=== ACCESSIBILITY ISSUES ===\n');

const a11yIssues = Object.entries(data.audits)
  .filter(([key, v]) => {
    return key.match(/^(aria|color|heading|label|button|link|image|form|input)/) &&
           v.score !== null &&
           v.score < 1;
  });

if (a11yIssues.length === 0) {
  console.log('No critical accessibility issues found ✓');
} else {
  a11yIssues.forEach(([key, audit]) => {
    console.log(`- ${audit.title}: Score ${audit.score}`);
  });
}
