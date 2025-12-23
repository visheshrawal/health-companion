try {
  const pkg = require('@vly-ai/integrations');
  console.log('Exports:', Object.keys(pkg));
} catch (e) {
  console.error(e);
}
