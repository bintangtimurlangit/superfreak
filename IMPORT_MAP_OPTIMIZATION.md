# Import Map Generation Optimization

## What is Import Map Generation?

The "Generating import map" message appears because Payload CMS automatically checks if the import map needs to be regenerated on each request in development mode. The import map is used to resolve component paths for the Payload admin panel.

## Why It Slows Down Pages

In development mode, Payload checks the import map file on every request to see if it needs to be regenerated. Even though it says "No new imports found, skipping writing import map", the **check itself** adds latency to each request.

## Current Behavior

- ✅ **Good**: It's not actually regenerating (says "skipping writing")
- ⚠️ **Issue**: The check happens on every request, adding ~100-500ms latency

## Solutions

### Option 1: Pre-generate Import Map (Recommended)

Run this command once after making changes to components:

```bash
pnpm generate:importmap
```

This pre-generates the import map, so Payload can skip the check more quickly.

### Option 2: Environment Variable (If Available)

Some Payload versions support disabling auto-generation via environment variable. Check Payload documentation for:
- `PAYLOAD_DISABLE_IMPORT_MAP_GENERATION=true`
- Or similar environment variable

### Option 3: Manual Generation Workflow

1. **During Development**: 
   - Run `pnpm generate:importmap` manually when you add/modify components
   - The check will be faster since the map is already up-to-date

2. **Before Committing**:
   - Always run `pnpm generate:importmap` to ensure the import map is current

## Performance Impact

- **With check**: ~100-500ms added to each request
- **After pre-generation**: ~10-50ms (just file read, no generation)

## Note

The import map is **only needed for the Payload admin panel** (`/admin` routes). It does NOT affect your frontend pages (`/profile`, `/`, etc.). However, the check might still run on all requests in development mode.

## Future Optimization

Payload CMS may add an option to disable this check in future versions. For now, pre-generating the import map is the best solution.

