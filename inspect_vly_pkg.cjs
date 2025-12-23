try {
  const pkg = require('@vly-ai/integrations');
  console.log('Exports:', Object.keys(pkg));
  if (pkg.VlyIntegrations) {
    console.log('VlyIntegrations prototype:', Object.getOwnPropertyNames(pkg.VlyIntegrations.prototype));
    try {
        // Try to see if we can get the constructor params length or something
        console.log('VlyIntegrations length:', pkg.VlyIntegrations.length);
    } catch (e) {}
  }
} catch (e) {
  console.error('Error:', e);
}
