# NÜ-LINE Digital Book Website — Version 3

Version 3 preserves the full Edition I digital-book website and adds a premium **Contact / Begin a Project** enquiry experience.

## New in Version 3
- Premium project enquiry panel, responsive on iPhone and desktop.
- Captures customer, company and project information.
- Product/system selection for HYLINE, Sheerline, Residence 9, rooflights, balustrades and architectural glass.
- Secure submission into the existing NÜ-LINE Supabase project.
- Every enquiry receives a unique `WEB-...` reference and is stored in `website_enquiries`.
- Public visitors can insert enquiries only; they cannot read CRM data.
- Basic spam honeypot and browser validation included.

## Important: one-time Supabase setup
1. Open your existing NÜ-LINE Supabase project.
2. Open **SQL Editor**.
3. Copy and run the complete contents of `supabase-website-enquiries.sql`.
4. Confirm that the `website_enquiries` table appears in Table Editor.

## Deployment
Upload all Version 3 files to the website GitHub repository, replacing matching files. This is the public website repository, not the CRM repository.

After Vercel deploys, open:

`https://nu-lineglazing.co.uk/?v=3`

Test the form using **Contact** or **Begin a project**. Then confirm the record appears in Supabase → Table Editor → `website_enquiries`.

## CRM connection
The submissions are stored in the same Supabase project and are ready for the Business OS. CRM Version 12 does not yet display the new table. The next CRM release should add a **Website Enquiries** inbox with Convert to Contact, Convert to Opportunity and Create Proposal actions.

## Security
`config.js` contains only the Supabase publishable browser key. Row Level Security in the SQL file prevents public visitors from reading or changing private information. Do not put a service-role key in this website.
