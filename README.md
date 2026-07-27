# NÜ-LINE Digital Book Website — Version 3.1

Version 3.1 preserves the working Version 3 website, contact form and Supabase enquiry connection.

## Version 3.1 fix

- Removes 3D CSS transforms from brochure page images.
- Prevents iPhone/iPad Safari from rasterising brochure pages at reduced resolution.
- Uses opacity-only page transitions.
- Waits for each image to decode before completing the page transition.
- Adds Version 3.1 cache-busting to brochure images and application files.
- Uses network-first delivery for JPG brochure pages.

## Deployment

Upload all files to the website repository and replace the Version 3 files. Keep the included `config.js`; it contains the public Supabase connection used by the working enquiry form. The database tables do not need to be recreated.

After Vercel deploys, open:

`https://nu-lineglazing.co.uk/?v=3.1`
