/**
 * Default legal texts (English). Shown until a version is saved in
 * Studio → Legal. Format: "## " heading, "- " bullet, blank line = new
 * paragraph, **bold**, [link](/path). {{placeholders}} are filled from
 * Studio → Settings (see src/lib/settings/legal.ts).
 */
export const EN = {
  privacy: {
    title: "Privacy Policy",
    body: `This policy explains which personal data {{company}} collects through {{site}}, why, and what your rights are.

## Who we are
{{company}} is run by {{owner}}, {{address}}. Chamber of Commerce (KvK) number {{kvk}}. Questions about privacy: {{email}}.

## What we collect and why
- **Account:** your email address, name and (encrypted) password, so you can sign in and find your purchases in your library. Basis: performing our agreement with you.
- **Purchases:** payments are handled by Polar (see below). We receive your email address, what you bought, the license, the amount and Polar's order number, so we can deliver your files and keep the legally required records. We never see your card or bank details.
- **Free designs:** your email address and which design you asked for, so we can mail you the download link and tell you about updates to that design.
- **Newsletter:** your email address, language, chosen categories and when you gave and confirmed consent. You only join after clicking the link in the confirmation mail (double opt-in). Basis: your consent, which you can withdraw at any time with the link in every newsletter.
- **Update mails:** when there is a new version of a design you own, we mail you. Basis: our legitimate interest in giving you what you paid for. Every update mail has a link to stop them.
- **Contact form and model requests:** your name, email address and message, so we can answer you. If we put your model request on the public wish list, only its title and description are shown — never your name or email address.
- **Votes on the wish list:** which requests you voted for, linked to your account.
- **Photos of your prints:** the photo, the name you choose to show with it and your caption. They are only published after review, and only because you agreed to it. Ask us and we remove it.
- **Visitor statistics:** we use Umami, which counts visits without cookies and without storing your IP address or anything that identifies you.

## Who processes your data for us
- Supabase — database, accounts and file storage
- Netlify — hosting of the website
- Resend — sending emails
- Umami — anonymous visitor statistics
- Polar (polar.sh) — sells our designs as merchant of record. For the payment Polar is responsible for your data itself; its own privacy policy applies.

Some of these companies are based outside the European Union (mainly in the United States). Where that is the case, your data is protected by the EU Standard Contractual Clauses or the EU–US Data Privacy Framework. We never sell your data.

## How long we keep it
- Account: until you delete it, or ask us to.
- Orders: 7 years, because Dutch tax law requires it.
- Free downloads and update-mail records: as long as the design is offered, so we can tell you about updates; ask us and we delete them sooner.
- Newsletter: until you unsubscribe. Signups that are not confirmed are erased after 30 days.
- Contact messages and requests: up to 2 years after they are handled.
- Photos of your prints: until you ask us to remove them, or we take them down.

## Your rights
You have the right to see, correct or delete your data, to restrict or object to its use, to receive it in a portable format, and to withdraw consent at any time. Mail {{email}} and we answer within one month. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).

## Security
Your data is stored with encryption, files are only downloadable with a personal link, and only the owner of {{company}} has admin access.

## Changes
If this policy changes, the new version is published here with a new date.`,
  },

  cookies: {
    title: "Cookie Policy",
    body: `{{site}} only uses cookies that are needed for the site to work. We do not use advertising or tracking cookies, so we don't show a cookie banner.

## Cookies we use
- **Sign-in (sb-…):** keeps you signed in to your account. Removed when you sign out.
- **theme:** remembers light or dark mode (1 year).
- **3dpiy_track:** remembers whether you last visited the Shop or Business part of the site.

## Statistics without cookies
Visitor statistics come from Umami, which works without cookies and does not identify you.

## Checkout
When you pay, you go to Polar's checkout on polar.sh. Polar may set its own cookies there; Polar's cookie policy applies.

## Removing cookies
You can delete cookies in your browser settings at any time. You may then have to sign in again.`,
  },

  terms: {
    title: "Terms & Conditions",
    body: `These terms apply to every use of {{site}} and every purchase or download of a design from {{company}}.

## Who we are
{{company}}, run by {{owner}}, {{address}}. KvK {{kvk}}, VAT {{vat}}. Email: {{email}}.

## What we offer
We sell and give away digital 3D print files (such as STL and 3MF) that you print yourself. You never receive a physical product from us.

## Buying
- Purchases are processed by Polar (polar.sh), which acts as merchant of record: Polar sells the design to you on our behalf, handles the payment and charges the VAT that applies in your country. Polar's terms apply to the payment itself.
- Prices are shown in euros and include VAT.
- The agreement is made as soon as your payment is completed.

## Delivery
You can download your files immediately after payment, on the confirmation page and in your library on {{site}} (see our Digital Delivery Policy).

## Right of withdrawal
For digital content you normally have 14 days to withdraw. Because you get the files immediately, you are asked at checkout to agree that delivery starts right away and that you therefore lose this right. Without that agreement the purchase cannot be completed.

## If something is wrong
If a file is damaged, incomplete or does not match the description, mail {{email}}. We will fix or replace the file, or refund you through Polar if that is not possible. Your statutory rights as a consumer are not affected.

## Updates
Improved versions of a design you own are free. You will find them in your library, and we mail you when a new version is ready. A substantially different design is published as a new product.

## Using the designs
What you may do with a design depends on its license — see our License Agreement. The design files and photos remain the intellectual property of {{company}}.

## Your account
Keep your password to yourself; you are responsible for what happens with your account. We may close an account that is misused.

## Things you send us
When you send a model request or a photo of your print, you confirm that it is yours and that it doesn't break any law or anyone's rights. You allow us to show it on {{site}}. We decide what we publish, and remove it when you ask.

## Printing safely
You print and use the objects at your own risk. Results depend on your printer, settings and material. Printed objects are not certified toys and can contain small parts — keep them away from young children. Our liability is limited to the amount you paid for the design, except in case of intent or gross negligence.

## Applicable law
Dutch law applies. If you are a consumer living elsewhere in the EU, you keep the protection that the mandatory consumer law of your own country gives you. Disputes go to the competent court in the Netherlands, unless the law gives you the right to go to a court in your own country.

## Changes
We may change these terms. The version that applied at the moment of your purchase stays valid for that purchase.

## Questions?
Missing something, something not right, or a question or remark? Mail {{email}} — I'll see how I can help.`,
  },

  delivery: {
    title: "Digital Delivery Policy",
    body: `Everything {{company}} sells is digital. Nothing is shipped.

## When and how you get your files
- **Immediately after payment** you see download buttons on the confirmation page. These links work for 7 days.
- **In your library:** sign in on {{site}} with the email address you paid with, and your designs are in your library — also if you create the account later. From there you can download them as often as you like.
- **Free designs:** we mail the download link to the address you enter. The link works for 30 days; with an account the design is also in your library.

## File formats
The formats of each design (for example STL and 3MF, sometimes with a PDF with instructions) are listed on its product page.

## Bundles
A bundle gives you every design in it. Each design appears separately in your library.

## Updates
New versions of a design you own are free and appear in your library automatically. We mail you when there is one; you can turn these mails off with the link in them.

## Problems downloading?
Mail {{email}} with your order email address and we'll sort it out.`,
  },

  license: {
    title: "License Agreement",
    body: `When you buy or download a design from {{company}}, you do not buy the design itself but a license to use it. The design always remains the property of {{company}}. The license you have is shown on the product page and at checkout.

## Personal license (all Shop designs and free designs)
You may:
- print the design as often as you like for yourself and your household;
- give a print away as a gift;
- change the file for your own use.

You may not:
- sell prints, or use them in anything you sell;
- share, upload, resell or give away the files, changed or not;
- use the files to train AI models or put them in datasets.

## Business licenses (3DPIY Business)
On the Business part of the site, designs come with one of these licenses:
- **Personal:** the same as the personal license above.
- **Startup:** for companies of up to 5 people. You may use the design in your own products and sell physical prints of it.
- **Studio:** for studios and companies of any size. You may sell unlimited physical copies under your own brand, also as part of work for your clients. Includes the STEP file and one custom design request.

With every business license the files themselves still may not be shared, resold or published.

## General
- The license is personal, non-exclusive and valid forever. It cannot be transferred to someone else.
- Updates to the design fall under the same license.
- Mentioning {{company}} is appreciated but not required.
- If you break these rules, the license ends and we may take further action.

Need a different license? Mail {{email}}.`,
  },
} as const;
