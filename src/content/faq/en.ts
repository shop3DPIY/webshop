/**
 * Default FAQ texts (English). Every "## " line is a question; the lines
 * under it are the answer (same format as the legal texts, editable in
 * Studio → Texts). {{email}} etc. are filled from Settings.
 */
export const FAQ_EN = {
  "faq-shop": {
    title: "Frequently asked questions — Shop",
    body: `## What do I get when I buy a design?
A digital file — usually STL and/or 3MF — that you print yourself on your own 3D printer. Nothing physical is shipped.

## Which printer and material do I need?
The designs are made for FDM printers (filament). Every product page lists the nozzle, layer height, materials and the printers it was tested on (Bambu Lab A1 and X1 Carbon). Designs marked "Multicolour · AMS" use several colours, but can also be printed in one colour without an AMS.

## What's the difference between STL and 3MF?
An STL is only the shape. A 3MF is a complete project with plates, settings and sometimes colours already set up — open it in Bambu Studio or OrcaSlicer and you're almost ready to print. Use the STL if your slicer doesn't read 3MF.

## How do I download my files?
Right after paying you see download buttons on the confirmation page (they work for 7 days). Your designs also stay in your library on 3dpiy.com forever: sign in or create an account with the email address you paid with.

## Do I need an account?
No, you can buy as a guest. With an account (free) you can download your designs again at any time, save price calculations and vote on the wish list.

## May I sell what I print?
Not with the personal license of Shop designs: you may print them for yourself, your household and as a gift. To sell prints you need a business license — see 3DPIY Business.

## Do I get updates?
Yes. Improved versions of a design you own are free; they appear in your library and you get an email.

## Can I get my money back?
Because you can download right away, there's no 14-day withdrawal period for digital files — you agree to that at checkout. Is a file broken or not as described? Mail {{email}}: I'll fix or replace it, or refund you if that isn't possible.

## Are prices including VAT?
Yes. Payment runs through Polar, which charges the VAT of your country and shows the payment methods you can use.

## How do free designs work?
Fill in your email address on the design's page and you get a download link by email (valid for 30 days). Some free designs are also on MakerWorld, where you can open them straight in Bambu Studio.

## Missing a design, or something not right?
Send it via the wish list & requests page or mail {{email}} — I'll see how I can help.`,
  },
  "faq-business": {
    title: "Frequently asked questions — Business",
    body: `## Which license do I need?
Personal: printing for your own use only. Startup: for small companies that use the design in their own products and sell physical prints. Studio: for studios and companies that sell unlimited copies under their own brand, including the STEP file and one custom design request. The License Agreement has the details.

## May I use a design in products for my clients?
With the Studio license, yes: you may sell physical copies under your own brand, also as part of work for your clients. The files themselves may never be shared, resold or published.

## Do I get an invoice for my company?
Yes. At checkout, choose that you're buying as a business and fill in your company details; Polar, which handles the payment, sends the invoice.

## Is the STEP file included?
With the Studio license. Need it with another license? Mail {{email}}.

## Can I upgrade my license later?
Yes — mail {{email}} with your order and the license you need; you only pay the difference.

## Can you design something specially for us?
Yes. The Studio license includes one custom design request; for anything else, mail {{email}} and I'll make you an offer.

## Do updates cost extra?
No. Improved versions of a design you own are free and fall under the same license.

## Missing something, or a question?
Mail {{email}} — I'll see how I can help.`,
  },
} as const;
